import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';

function sqliteD1(sqlite) {
  return { prepare(sql) {
    let args=[];
    const prepared = () => sqlite.prepare(sql);
    return {
      bind(...values) { args=values; return this; },
      async first(column) { const row=prepared().get(...args); return column ? row?.[column] ?? null : row ?? null; },
      async all() { return { success: true, results: prepared().all(...args) }; },
      async raw() { const statement=prepared(); statement.setReturnArrays(true); return statement.all(...args); },
      async run() { const result=prepared().run(...args); return { success:true, meta:{ changes:Number(result.changes), last_row_id:Number(result.lastInsertRowid) } }; },
    };
  } };
}

test('sales: migration, real lead persistence, authorization, optimistic edits, cohort attribution and privacy', async () => {
  const sqlite=new DatabaseSync(':memory:');
  const migrations=readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort();
  for(const file of migrations.filter(n=>n<'0003')) sqlite.exec(readFileSync(new URL(`../drizzle/${file}`,import.meta.url),'utf8'));
  sqlite.exec(`INSERT INTO leads(public_id,status,name,contact,contact_method,project_type,project_format,budget,details,ip_hash) VALUES ('S3D-LEGACY','Закрыта','Legacy test','legacy@example.com','E-mail','Кубок / награда','Один экземпляр','Не указан','Legacy closed inquiry','legacy')`);
  for(const file of migrations.filter(n=>n>='0003')) sqlite.exec(readFileSync(new URL(`../drizzle/${file}`,import.meta.url),'utf8'));
  assert.equal(sqlite.prepare('SELECT sales_stage FROM leads WHERE id=1').get().sales_stage,'Не указан');
  assert.equal(sqlite.prepare('SELECT status FROM leads WHERE id=1').get().status,'Закрыта');
  const {default:worker}=await import(new URL('../dist/server/index.js',import.meta.url));
  const admin='synthetic-local-admin-key-for-tests';
  const env={DB:sqliteD1(sqlite),LEADS_ADMIN_KEY:admin,ASSETS:{fetch:async()=>new Response('Not found',{status:404})}};
  const context={waitUntil(){},passThroughOnException(){}};
  const request=(path,method='GET',body,auth=true)=>worker.fetch(new Request(`http://localhost${path}`,{method,headers:{...(auth?{'x-trifoti-admin-key':admin}:{}),...(body?{'content-type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})}),env,context);
  assert.equal((await request('/api/sales','GET',undefined,false)).status,401);
  assert.equal((await request('/api/sales','PATCH',{id:1},false)).status,401);
  const payload={consent:true,name:'Synthetic launch test',contact:'qa@example.com',contactMethod:'E-mail',projectType:'Кубок / награда',projectFormat:'Один экземпляр',budget:'До 100 000 ₽',details:'Synthetic integration test, do not contact.',source:'test_calculator',utmSource:'test_campaign',estimateMin:50000,estimateMax:80000,startedAt:Date.now()-15000};
  const created=await request('/api/leads','POST',payload,false);
  assert.equal(created.status,201);const receipt=await created.json();
  assert.equal(receipt.managerNotified,false);
  const row=sqlite.prepare('SELECT * FROM leads WHERE public_id=?').get(receipt.leadId);
  assert.equal(row.sales_stage,'Новая');assert.equal(row.quote_amount,null);assert.equal(row.paid_amount,null);
  const update={id:row.id,salesRevision:0,salesStage:'Заказ',quoteAmount:65000,paidAmount:30000,lostReason:''};
  for(const bad of [{...update,paidAmount:-1},{...update,quoteAmount:12.5},{...update,quoteAmount:'65000'},{...update,salesStage:'Готово'},{...update,salesRevision:-1}]) assert.equal((await request('/api/sales','PATCH',bad)).status,400);
  const saved=await request('/api/sales','PATCH',update);assert.equal(saved.status,200);assert.equal((await saved.json()).salesRevision,1);
  assert.equal((await request('/api/sales','PATCH',update)).status,409,'stale edits must not overwrite');
  assert.equal((await request('/api/sales','PATCH',{...update,id:999})).status,404);
  sqlite.exec(`INSERT INTO leads(public_id,name,contact,contact_method,project_type,project_format,budget,details,ip_hash,created_at,sales_stage,quote_amount,paid_amount) VALUES ('S3D-OLD','Old test','old@example.com','E-mail','Другое','','','Old test','old',datetime('now','-100 days'),'Заказ',1000000,1000000)`);
  const response=await request('/api/sales?days=30');assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/no-store/);const report=await response.json();
  assert.equal(report.totals.leads,2);assert.equal(report.totals.orders,1);assert.equal(report.totals.quoted,65000);assert.equal(report.totals.paid,30000);assert.equal(report.totals.quoteCount,1);
  assert.equal(report.sources.find(s=>s.label==='test_campaign').orders,1);assert.equal(report.sources.find(s=>s.label==='Без UTM').orders,0);assert.deepEqual(report.calibration,{compared:1,withinRange:1});
  const list=await (await request('/api/leads')).json();assert.equal(list.leads.find(l=>l.id===row.id).quoteAmount,65000);
  const csv=await (await request('/api/leads?format=csv')).text();assert.match(csv,/Этап продажи/);assert.match(csv,/65000/);
  const status=await request(`/api/status?id=${receipt.leadId}&token=${receipt.leadToken}`,'GET',undefined,false);
  assert.equal(status.status,200);const publicData=await status.text();assert.doesNotMatch(publicData,/65000|30000|quoteAmount|paidAmount|salesStage|qa@example/);
  const empty=await request('/api/sales','PATCH',{...update,salesRevision:1,quoteAmount:null,paidAmount:0,salesStage:'Отказ',lostReason:'Budget test'});
  assert.equal(empty.status,200);const final=sqlite.prepare('SELECT quote_amount,paid_amount,lost_reason,status FROM leads WHERE id=?').get(row.id);
  assert.equal(final.quote_amount,null);assert.equal(final.paid_amount,0);assert.equal(final.lost_reason,'Budget test');assert.equal(final.status,'Новая','sales updates must not change production status');
  sqlite.close();
});

test('lead notifications: Telegram rejection falls back, delivery failure never loses the application', async () => {
  const sqlite=new DatabaseSync(':memory:');
  for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL(`../drizzle/${file}`,import.meta.url),'utf8'));
  const {default:worker}=await import(new URL('../dist/server/index.js',import.meta.url));
  const env={DB:sqliteD1(sqlite),TELEGRAM_BOT_TOKEN:'123456:synthetic-not-a-real-bot-token',TELEGRAM_CHAT_ID:'12345',LEAD_WEBHOOK_URL:'https://notify.invalid/test',ASSETS:{fetch:async()=>new Response('Not found',{status:404})}};
  const originalFetch=globalThis.fetch, originalError=console.error;
  const calls=[];let failAll=false;
  globalThis.fetch=async(input)=>{const url=String(input);calls.push(url.startsWith('https://api.telegram.org/')?'telegram':'webhook');return url.startsWith('https://api.telegram.org/')?Response.json({ok:false},{status:failAll?503:200}):new Response('',{status:failAll?500:200});};
  console.error=()=>{};
  try {
    for(const failure of [false,true]) {
      failAll=failure;
      const response=await worker.fetch(new Request('http://localhost/api/leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({consent:true,name:'Synthetic delivery test',contact:'qa@example.com',contactMethod:'E-mail',projectType:'Другое',details:'Synthetic delivery verification only.',startedAt:Date.now()-10000,estimateMin:null,estimateMax:null})}),env,{waitUntil(){},passThroughOnException(){}});
      assert.equal(response.status,201);
      assert.equal((await response.json()).managerNotified,!failure);
    }
    assert.deepEqual(calls,['telegram','webhook','telegram','webhook']);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM leads').get().count,2);
    assert.equal(sqlite.prepare('SELECT estimate_min FROM leads LIMIT 1').get().estimate_min,null);
  } finally { globalThis.fetch=originalFetch;console.error=originalError;sqlite.close(); }
});
