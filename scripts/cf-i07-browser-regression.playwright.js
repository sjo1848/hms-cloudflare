(page) => (async () => {
  const widths = [375, 390, 430, 768, 1024];
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-a", "x-local-access-email": "a@test.com", "x-hotel-id": "hotel-a" });
  await page.goto("http://127.0.0.1:4174/users"); await page.getByRole("heading", { name: "Users administration" }).waitFor();
  for (const width of widths) { await page.setViewportSize({ width, height: 812 }); await page.waitForTimeout(100); const sw=await page.evaluate(()=>document.documentElement.scrollWidth); if(sw>width) throw new Error(`users overflow ${width}: ${sw}`); if(width===375){ await page.getByRole("textbox",{name:"Access subject"}).fill("subject-browser"); await page.getByRole("textbox",{name:"User email"}).fill("browser@example.com"); await page.getByRole("button",{name:"Create user"}).click(); await page.getByRole("status").waitFor(); } }
  await page.setExtraHTTPHeaders({ "x-local-access-subject": "subject-network", "x-local-access-email": "network@test.com" }); await page.goto("http://127.0.0.1:4174/network"); await page.getByRole("heading",{name:"Hotel network"}).waitFor();
  for(const width of widths){ await page.setViewportSize({width,height:812}); await page.waitForTimeout(100); const sw=await page.evaluate(()=>document.documentElement.scrollWidth); if(sw>width) throw new Error(`network overflow ${width}: ${sw}`); if(width===375){ await page.getByRole("button",{name:/Hotel A/}).click(); await page.getByRole("combobox",{name:"Property plan"}).selectOption("PRO"); await page.getByRole("status").waitFor(); } }
  await page.screenshot({path:"output/playwright/cf-i07-admin.png",fullPage:true}); return widths;
})()
