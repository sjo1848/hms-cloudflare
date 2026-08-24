import { Hono } from "hono";
import type { ApiVariables } from "../context";
import { ApiError } from "../errors";
import { hasCapability } from "../auth/capabilities";
import { email, jsonBody, requiredText } from "../validation";

type AdminApp = Hono<{ Bindings: Env; Variables: ApiVariables }>;
type Db = D1Database;
type Body = Record<string, unknown>;

function hotel(c: { get(name: "membership"): NonNullable<ApiVariables["membership"]> }): string {
  return c.get("membership").hotelId;
}
function requireHotel(c: Parameters<typeof hasCapability>[0] extends never ? never : any, capability: string) {
  const membership = c.get("membership");
  if (!membership || !hasCapability(membership.role, capability)) throw ApiError.forbidden();
}
function requireNetwork(c: any, capability: string) {
  if (!c.get("networkRole") || !hasCapability(c.get("networkRole"), capability)) throw ApiError.forbidden();
}
function audit(db: Db, c: any, action: string, targetType: string, targetId: string, hotelId: string | null, details: Record<string, unknown>) {
  return db.prepare("INSERT INTO control_audit_events (id,actor_subject,request_id,hotel_id,action,target_type,target_id,details_json,created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)").bind(crypto.randomUUID(), c.get("identity").subject, c.get("requestId"), hotelId, action, targetType, targetId, JSON.stringify(details), new Date().toISOString());
}

export function createAdminRoutes(): AdminApp {
  const app = new Hono<{ Bindings: Env; Variables: ApiVariables }>();

  app.get("/users", async (c) => {
    requireHotel(c, "users.read");
    const rows = await c.env.CONTROL_DB.prepare(`SELECT m.access_subject, i.email, m.role, m.active, m.hotel_id FROM hotel_memberships m JOIN access_identity_mappings i ON i.access_subject=m.access_subject WHERE m.hotel_id=?1 ORDER BY i.email, m.access_subject`).bind(hotel(c)).all();
    return c.json(rows.results);
  });
  app.post("/users", async (c) => {
    requireHotel(c, "users.write");
    const body = await jsonBody<Body>(c.req.raw); const subject = requiredText(body.access_subject, "access_subject", 2, 200); const mail = email(body.email); const role = requiredText(body.role, "role", 2, 40);
    if (!hasCapability(role, "rooms.read") && role !== "housekeeping") throw ApiError.badRequest("role is unsupported");
    if (subject === c.get("identity").subject) throw ApiError.conflict("Cannot modify your own membership");
    const existing = await c.env.CONTROL_DB.prepare("SELECT active FROM hotel_memberships WHERE access_subject=?1 AND hotel_id=?2").bind(subject, hotel(c)).first<{ active: number }>();
    if (existing) throw ApiError.conflict("Membership already exists");
    const nowHotel = hotel(c); const db = c.env.CONTROL_DB;
    try { await db.batch([db.prepare("INSERT INTO access_identity_mappings (access_subject,email,active) VALUES (?1,?2,1) ON CONFLICT(access_subject) DO UPDATE SET email=excluded.email, active=1").bind(subject, mail), db.prepare("INSERT INTO hotel_memberships (access_subject,hotel_id,role,active) VALUES (?1,?2,?3,1)").bind(subject, nowHotel, role), audit(db, c, "USER_CREATE", "USER", subject, nowHotel, { role, email: mail })]); } catch { throw ApiError.conflict("User membership could not be created"); }
    return c.json({ access_subject: subject, email: mail, role, hotel_id: nowHotel, active: 1 }, 201);
  });
  app.patch("/users/:subject/role", async (c) => {
    requireHotel(c, "users.write"); const subject = requiredText(c.req.param("subject"), "subject", 2, 200); const body = await jsonBody<Body>(c.req.raw); const role = requiredText(body.role, "role", 2, 40);
    if (!hasCapability(role, "rooms.read") && role !== "housekeeping") throw ApiError.badRequest("role is unsupported");
    if (subject === c.get("identity").subject) throw ApiError.conflict("Cannot modify your own membership"); const hid = hotel(c); const row = await c.env.CONTROL_DB.prepare("SELECT role,active FROM hotel_memberships WHERE access_subject=?1 AND hotel_id=?2").bind(subject, hid).first<{ role: string; active: number }>(); if (!row || !row.active) throw ApiError.notFound("Membership not found");
    const db=c.env.CONTROL_DB; try { await db.batch([db.prepare("UPDATE hotel_memberships SET role=?1 WHERE access_subject=?2 AND hotel_id=?3 AND active=1").bind(role,subject,hid), audit(db,c,"USER_ROLE_CHANGE","MEMBERSHIP",subject,hid,{ from:row.role,to:role })]); } catch { throw ApiError.conflict("Role change failed"); } return c.json({ access_subject:subject, hotel_id:hid, role, active:1 });
  });
  app.delete("/users/:subject", async (c) => {
    requireHotel(c, "users.delete"); const subject=requiredText(c.req.param("subject"),"subject",2,200); if(subject===c.get("identity").subject) throw ApiError.conflict("Cannot deactivate your own membership"); const hid=hotel(c); const row=await c.env.CONTROL_DB.prepare("SELECT active FROM hotel_memberships WHERE access_subject=?1 AND hotel_id=?2").bind(subject,hid).first<{active:number}>(); if(!row || !row.active) throw ApiError.notFound("Membership not found"); const db=c.env.CONTROL_DB; try { await db.batch([db.prepare("UPDATE hotel_memberships SET active=0 WHERE access_subject=?1 AND hotel_id=?2 AND active=1").bind(subject,hid), audit(db,c,"USER_DEACTIVATE","MEMBERSHIP",subject,hid,{})]); } catch { throw ApiError.conflict("Membership deactivation failed"); } return c.json({ access_subject:subject, hotel_id:hid, active:0 });
  });
  app.get("/audit/events", async (c) => { const m=c.get("membership"); if(!m || !hasCapability(m.role,"audit.events.read")) throw ApiError.forbidden(); const rows=await c.env.CONTROL_DB.prepare("SELECT id,actor_subject,request_id,hotel_id,action,target_type,target_id,details_json,created_at FROM control_audit_events WHERE hotel_id=?1 OR hotel_id IS NULL ORDER BY created_at DESC,id DESC LIMIT 200").bind(m.hotelId).all(); return c.json(rows.results); });

  app.get("/hotels", async (c) => { requireNetwork(c,"saas.hotels.read"); const rows=await c.env.CONTROL_DB.prepare("SELECT h.id,h.slug,h.operational_binding,h.active,COALESCE(m.name,'') name,m.address,m.plan_tier,m.features_json FROM control_hotels h LEFT JOIN hotel_admin_metadata m ON m.hotel_id=h.id ORDER BY h.slug").all(); return c.json(rows.results); });
  app.get("/hotels/network-kpis", async (c) => { requireNetwork(c,"saas.hotels.read"); const row=await c.env.CONTROL_DB.prepare("SELECT COUNT(*) hotel_count,COALESCE(SUM(active),0) active_hotel_count FROM control_hotels").first(); return c.json({ ...row, analytics_deferred:true, deferred_to:"CF-I08" }); });
  app.post("/hotels", async (c) => { requireNetwork(c,"saas.hotels.write"); const b=await jsonBody<Body>(c.req.raw); const id=requiredText(b.id,"id",2,100), slug=requiredText(b.slug,"slug",2,100), binding=requiredText(b.operational_binding,"operational_binding",2,100), name=requiredText(b.name,"name",1,150); if(!(binding in c.env) || !["HOTEL_DEMO_DB","HOTEL_SECOND_DB"].includes(binding)) throw ApiError.badRequest("operational_binding is not server-configured"); const db=c.env.CONTROL_DB; try { await db.batch([db.prepare("INSERT INTO control_hotels (id,slug,operational_binding,active) VALUES (?1,?2,?3,1)").bind(id,slug,binding),db.prepare("INSERT INTO hotel_admin_metadata (hotel_id,name,address,plan_tier,features_json) VALUES (?1,?2,?3,?4,?5)").bind(id,name,typeof b.address==="string"?b.address:null,typeof b.plan_tier==="string"?b.plan_tier:"FREE",typeof b.features_json==="string"?b.features_json:"{}"),audit(db,c,"HOTEL_CREATE","HOTEL",id,null,{slug,binding})]); } catch { throw ApiError.conflict("Hotel could not be registered"); } return c.json({id,slug,name,operational_binding:binding,active:1},201); });
  app.patch("/hotels/:id/plan", async (c) => { requireNetwork(c,"saas.hotels.write"); const id=requiredText(c.req.param("id"),"id",2,100); const b=await jsonBody<Body>(c.req.raw); const plan=requiredText(b.plan_tier,"plan_tier",2,30); const db=c.env.CONTROL_DB; const row=await db.prepare("SELECT id FROM control_hotels WHERE id=?1").bind(id).first(); if(!row) throw ApiError.notFound("Hotel not found"); try { await db.batch([db.prepare("INSERT INTO hotel_admin_metadata (hotel_id,plan_tier) VALUES (?1,?2) ON CONFLICT(hotel_id) DO UPDATE SET plan_tier=excluded.plan_tier").bind(id,plan),audit(db,c,"HOTEL_PLAN_CHANGE","HOTEL",id,null,{plan_tier:plan})]); } catch { throw ApiError.conflict("Plan change failed"); } return c.json({id,plan_tier:plan}); });
  return app;
}
