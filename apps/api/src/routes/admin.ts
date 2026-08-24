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
    const identity = await db.prepare("SELECT email, active FROM access_identity_mappings WHERE access_subject=?1").bind(subject).first<{ email: string; active: number }>();
    if (identity && (identity.email !== mail || !identity.active)) throw ApiError.conflict("Access identity is already owned or inactive");
    try {
      const statements = identity
        ? [db.prepare("INSERT INTO hotel_memberships (access_subject,hotel_id,role,active) VALUES (?1,?2,?3,1)").bind(subject, nowHotel, role), audit(db, c, "USER_CREATE", "USER", subject, nowHotel, { role, email: identity.email })]
        : [db.prepare("INSERT INTO access_identity_mappings (access_subject,email,active) VALUES (?1,?2,1)").bind(subject, mail), db.prepare("INSERT INTO hotel_memberships (access_subject,hotel_id,role,active) VALUES (?1,?2,?3,1)").bind(subject, nowHotel, role), audit(db, c, "USER_CREATE", "USER", subject, nowHotel, { role, email: mail })];
      await db.batch(statements);
    } catch { throw ApiError.conflict("User membership could not be created"); }
    return c.json({ access_subject: subject, email: mail, role, hotel_id: nowHotel, active: 1 }, 201);
  });
  app.patch("/users/:subject/role", async (c) => {
    requireHotel(c, "users.write"); const subject = requiredText(c.req.param("subject"), "subject", 2, 200); const body = await jsonBody<Body>(c.req.raw); const role = requiredText(body.role, "role", 2, 40);
    if (!hasCapability(role, "rooms.read") && role !== "housekeeping") throw ApiError.badRequest("role is unsupported");
    if (subject === c.get("identity").subject) throw ApiError.conflict("Cannot modify your own membership"); const hid = hotel(c); const row = await c.env.CONTROL_DB.prepare("SELECT role,active FROM hotel_memberships WHERE access_subject=?1 AND hotel_id=?2").bind(subject, hid).first<{ role: string; active: number }>(); if (!row || !row.active) throw ApiError.notFound("Membership not found");
    const db=c.env.CONTROL_DB; try { const results=await db.batch([db.prepare("UPDATE hotel_memberships SET role=?1 WHERE access_subject=?2 AND hotel_id=?3 AND active=1 AND role=?4").bind(role,subject,hid,row.role),db.prepare("INSERT INTO control_audit_events (id,actor_subject,request_id,hotel_id,action,target_type,target_id,details_json,created_at) SELECT ?1,?2,?3,?4,'USER_ROLE_CHANGE','MEMBERSHIP',?5,?6,?7 WHERE changes()=1").bind(crypto.randomUUID(),c.get("identity").subject,c.get("requestId"),hid,subject,JSON.stringify({ from:row.role,to:role }),new Date().toISOString())]); if(results[0]?.meta.changes!==1) throw ApiError.conflict("Membership changed concurrently"); } catch (error) { if(error instanceof ApiError) throw error; throw ApiError.conflict("Role change failed"); } return c.json({ access_subject:subject, hotel_id:hid, role, active:1 });
  });
  app.delete("/users/:subject", async (c) => {
    requireHotel(c, "users.delete"); const subject=requiredText(c.req.param("subject"),"subject",2,200); if(subject===c.get("identity").subject) throw ApiError.conflict("Cannot deactivate your own membership"); const hid=hotel(c); const row=await c.env.CONTROL_DB.prepare("SELECT active FROM hotel_memberships WHERE access_subject=?1 AND hotel_id=?2").bind(subject,hid).first<{active:number}>(); if(!row || !row.active) throw ApiError.notFound("Membership not found"); const db=c.env.CONTROL_DB; try { const results=await db.batch([db.prepare("UPDATE hotel_memberships SET active=0 WHERE access_subject=?1 AND hotel_id=?2 AND active=1").bind(subject,hid),db.prepare("INSERT INTO control_audit_events (id,actor_subject,request_id,hotel_id,action,target_type,target_id,details_json,created_at) SELECT ?1,?2,?3,?4,'USER_DEACTIVATE','MEMBERSHIP',?5,'{}',?6 WHERE changes()=1").bind(crypto.randomUUID(),c.get("identity").subject,c.get("requestId"),hid,subject,new Date().toISOString())]); if(results[0]?.meta.changes!==1) throw ApiError.conflict("Membership changed concurrently"); } catch (error) { if(error instanceof ApiError) throw error; throw ApiError.conflict("Membership deactivation failed"); } return c.json({ access_subject:subject, hotel_id:hid, active:0 });
  });
  app.get("/audit/events", async (c) => { const m=c.get("membership"); const network=c.get("networkRole")==="saas_admin"; if((!m || !hasCapability(m.role,"audit.events.read")) && !network) throw ApiError.forbidden(); const control=network ? await c.env.CONTROL_DB.prepare("SELECT id,actor_subject,request_id,hotel_id,action,target_type,target_id,details_json,created_at,'control' AS provenance FROM control_audit_events ORDER BY created_at DESC,id DESC LIMIT 200").all() : await c.env.CONTROL_DB.prepare("SELECT id,actor_subject,request_id,hotel_id,action,target_type,target_id,details_json,created_at,'control' AS provenance FROM control_audit_events WHERE hotel_id=?1 ORDER BY created_at DESC,id DESC LIMIT 200").bind(m!.hotelId).all(); if(!m) return c.json(control.results); const db=c.get("operationalDatabase"); const [life,house,billing]=await Promise.all([db.prepare("SELECT id,actor_subject,request_id,hotel_id,event_type AS action, 'lifecycle' AS target_type, booking_id AS target_id, details_json,created_at,'operational' AS provenance FROM lifecycle_events ORDER BY created_at DESC,id DESC LIMIT 200").all(),db.prepare("SELECT id,actor_subject,request_id,hotel_id,event_type AS action, 'housekeeping' AS target_type, room_id AS target_id, details_json,created_at,'operational' AS provenance FROM housekeeping_events ORDER BY created_at DESC,id DESC LIMIT 200").all(),db.prepare("SELECT id,actor_subject,request_id,hotel_id,event_type AS action, 'billing' AS target_type, booking_id AS target_id, details_json,created_at,'operational' AS provenance FROM financial_events ORDER BY created_at DESC,id DESC LIMIT 200").all()]); const results=[...control.results,...life.results,...house.results,...billing.results].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))||String(b.id).localeCompare(String(a.id))).slice(0,200); return c.json(results); });

  app.get("/hotels", async (c) => { requireNetwork(c,"saas.hotels.read"); const rows=await c.env.CONTROL_DB.prepare("SELECT h.id,h.slug,h.operational_binding,h.active,COALESCE(m.name,'') name,m.address,m.plan_tier,m.features_json FROM control_hotels h LEFT JOIN hotel_admin_metadata m ON m.hotel_id=h.id ORDER BY h.slug").all(); return c.json(rows.results); });
  app.get("/hotels/network-kpis", async (c) => { requireNetwork(c,"saas.hotels.read"); const row=await c.env.CONTROL_DB.prepare("SELECT COUNT(*) hotel_count,COALESCE(SUM(active),0) active_hotel_count FROM control_hotels").first(); return c.json({ ...row, analytics_deferred:true, deferred_to:"CF-I08" }); });
  app.post("/hotels", async (c) => { requireNetwork(c,"saas.hotels.write"); const b=await jsonBody<Body>(c.req.raw); const id=requiredText(b.id,"id",2,100), slug=requiredText(b.slug,"slug",2,100), binding=requiredText(b.operational_binding,"operational_binding",2,100), name=requiredText(b.name,"name",1,150), plan=typeof b.plan_tier==="string"?b.plan_tier:"BASIC"; if(!(binding in c.env) || !["HOTEL_DEMO_DB","HOTEL_SECOND_DB"].includes(binding)) throw ApiError.badRequest("operational_binding is not server-configured"); if(!["BASIC","PRO","ENTERPRISE"].includes(plan)) throw ApiError.badRequest("plan_tier is invalid"); const db=c.env.CONTROL_DB; try { await db.batch([db.prepare("INSERT INTO control_hotels (id,slug,operational_binding,active) VALUES (?1,?2,?3,1)").bind(id,slug,binding),db.prepare("INSERT INTO hotel_admin_metadata (hotel_id,name,address,plan_tier,features_json) VALUES (?1,?2,?3,?4,?5)").bind(id,name,typeof b.address==="string"?b.address:null,plan,typeof b.features_json==="string"?b.features_json:"{}"),audit(db,c,"HOTEL_CREATE","HOTEL",id,null,{slug,binding,plan_tier:plan})]); } catch { throw ApiError.conflict("Hotel could not be registered"); } return c.json({id,slug,name,operational_binding:binding,plan_tier:plan,active:1},201); });
  app.patch("/hotels/:id/plan", async (c) => { requireNetwork(c,"saas.hotels.write"); const id=requiredText(c.req.param("id"),"id",2,100); const b=await jsonBody<Body>(c.req.raw); const plan=requiredText(b.plan_tier,"plan_tier",2,30); if(!["BASIC","PRO","ENTERPRISE"].includes(plan)) throw ApiError.badRequest("plan_tier is invalid"); const db=c.env.CONTROL_DB; const row=await db.prepare("SELECT plan_tier FROM hotel_admin_metadata WHERE hotel_id=?1").bind(id).first<{plan_tier:string}>(); if(!row) throw ApiError.notFound("Hotel not found"); try { const results=await db.batch([db.prepare("UPDATE hotel_admin_metadata SET plan_tier=?1 WHERE hotel_id=?2 AND plan_tier=?3").bind(plan,id,row.plan_tier),db.prepare("INSERT INTO control_audit_events (id,actor_subject,request_id,hotel_id,action,target_type,target_id,details_json,created_at) SELECT ?1,?2,?3,NULL,'HOTEL_PLAN_CHANGE','HOTEL',?4,?5,?6 WHERE changes()=1").bind(crypto.randomUUID(),c.get("identity").subject,c.get("requestId"),id,JSON.stringify({from:row.plan_tier,to:plan}),new Date().toISOString())]); if(results[0]?.meta.changes!==1) throw ApiError.conflict("Hotel plan changed concurrently"); } catch (error) { if(error instanceof ApiError) throw error; throw ApiError.conflict("Plan change failed"); } return c.json({id,plan_tier:plan}); });
  return app;
}
