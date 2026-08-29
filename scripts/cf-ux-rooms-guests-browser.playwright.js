(page) => (async () => {
  await page.setExtraHTTPHeaders({"x-local-access-subject":"source-user:subject-a","x-local-access-email":"a@example.test","x-hotel-id":"hotel-a"});
  const rooms=[{id:"room-a",room_number:"101",room_type:"STANDARD",status:"Available",price_cents:18000},{id:"room-b",room_number:"102",room_type:"DELUXE",status:"Available",price_cents:22000}];
  const guests=[{id:"guest-a",full_name:"Ana Guest",email:"ana@example.test",phone:"+54 261 555-0101"},{id:"guest-b",full_name:"Bruno Guest",email:"bruno@example.test",phone:null}];
  const holds={"room-a":[{id:"hold-a",start_date:"2026-09-01",end_date:"2026-09-03",hold_type:"Other",reason:"A hold"}],"room-b":[{id:"hold-b",start_date:"2026-09-04",end_date:"2026-09-06",hold_type:"Other",reason:"B hold"}]};
  let guestLoadCount=0,roomCreated=false,guestCreated=false;
  const json=(route,status,body)=>route.fulfill({status,contentType:"application/json",body:JSON.stringify(body)});
  await page.route("**/api/v1/**",async route=>{
    const request=route.request(),url=request.url(),method=request.method();
    if(url.endsWith("/api/v1/auth/me")) return json(route,200,{hotel_id:"hotel-a",hotel_name:"Hotel Norte"});
    if(url.endsWith("/api/v1/rooms")&&method==="GET") return json(route,200,roomCreated?rooms.concat({id:"room-c",room_number:"103",room_type:"STANDARD",status:"Available",price_cents:19000}):rooms);
    if(url.endsWith("/api/v1/rooms")&&method==="POST"){roomCreated=true;return json(route,201,{id:"room-c"});}
    if(url.includes("/api/v1/rooms/")&&url.endsWith("/holds")&&method==="GET"){const id=url.split("/rooms/")[1].split("/")[0];if(id==="room-a")await page.waitForTimeout(250);return json(route,200,holds[id]||[]);}
    if(url.includes("/api/v1/rooms/")&&url.endsWith("/holds")&&method==="POST"){const id=url.split("/rooms/")[1].split("/")[0],p=JSON.parse(request.postData()||"{}");holds[id]=(holds[id]||[]).concat({id:"hold-new",start_date:p.start_date,end_date:p.end_date,hold_type:p.hold_type,reason:p.reason});return json(route,201,{id:"hold-new"});}
    if(url.endsWith("/api/v1/guests")&&method==="GET"){guestLoadCount+=1;if(guestLoadCount===1)return json(route,503,{error:{message:"Guests temporarily unavailable"}});return json(route,200,guestCreated?guests.concat({id:"guest-c",full_name:"Carla Guest",email:"carla@example.test",phone:null}):guests);}
    if(url.endsWith("/api/v1/guests")&&method==="POST"){guestCreated=true;return json(route,201,{id:"guest-c"});}
    return json(route,404,{error:{message:"Not found"}});
  });
  const widths=[375,430,768,1366];
  await page.goto("http://127.0.0.1:4174/rooms",{waitUntil:"domcontentloaded"});
  await page.getByRole("heading",{name:"Rooms",level:1}).waitFor();
  await page.getByRole("button",{name:"Room 101"}).click();
  await page.getByRole("heading",{name:"Room 101"}).waitFor();
  await page.getByLabel("Start").fill("2026-09-01");await page.getByLabel("End").fill("2026-09-03");await page.getByLabel("Reason").fill("Maintenance window");await page.getByRole("button",{name:"Add hold"}).click();await page.getByText("Maintenance window").waitFor();
  if(await page.getByLabel("Reason").inputValue()!=="")throw new Error("hold form was not reset");
  await page.getByRole("button",{name:"Room 101"}).click();await page.getByRole("button",{name:"Room 102"}).click();await page.getByRole("heading",{name:"Room 102"}).waitFor();await page.getByText("B hold").waitFor();
  if(await page.getByText("A hold").count())throw new Error("stale Room A hold leaked into Room B");
  await page.getByLabel("Room number").fill("103");await page.getByLabel("Room type").fill("STANDARD");await page.getByLabel("Price in cents").fill("19000");await page.getByRole("button",{name:"Add room"}).click();await page.getByRole("button",{name:"Room 103"}).waitFor();if(await page.getByLabel("Room number").inputValue()!=="")throw new Error("room form was not reset");
  for(const width of widths){await page.setViewportSize({width,height:812});await page.waitForTimeout(100);if(await page.evaluate(()=>document.documentElement.scrollWidth)>width)throw new Error("Rooms overflow at "+width);}
  await page.goto("http://127.0.0.1:4174/guests",{waitUntil:"domcontentloaded"});await page.getByRole("heading",{name:"Guests",level:1}).waitFor();await page.getByRole("alert").filter({hasText:"Guests temporarily unavailable"}).waitFor();await page.getByRole("button",{name:"Try again"}).click();await page.getByRole("button",{name:/Ana Guest/}).waitFor();await page.getByRole("button",{name:/Ana Guest/}).click();await page.getByRole("heading",{name:"Ana Guest"}).waitFor();await page.getByLabel("Full name").fill("Carla Guest");await page.getByLabel("Email").fill("carla@example.test");await page.getByRole("button",{name:"Add guest"}).click();await page.getByRole("button",{name:/Carla Guest/}).waitFor();if(await page.getByLabel("Full name").inputValue()!=="")throw new Error("guest form was not reset");
  for(const width of widths){await page.setViewportSize({width,height:812});await page.waitForTimeout(100);if(await page.evaluate(()=>document.documentElement.scrollWidth)>width)throw new Error("Guests overflow at "+width);}
  await page.screenshot({path:"output/playwright/cf-ux-mobile-002-rooms-guests.png",fullPage:true});
  return {widths,mockApi:true,rooms:"selection-hold-form-concurrency-responsive",guests:"retry-selection-form-responsive"};
})()