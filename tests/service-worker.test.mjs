import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { validateEdition, isNewerEdition } from "../edition-status.js";

const source=(await readFile(new URL("../sw.js",import.meta.url),"utf8")).replace(/^import[^\n]+\n/,"");
const sample=JSON.parse(await readFile(new URL("../data/cincinnati/current-weekend.json",import.meta.url),"utf8"));
function worker(fetcher,cached){
  const handlers={},writes=[];
  const caches={open:async()=>({put:async(key,response)=>writes.push({key,response})}),match:async()=>cached};
  runInNewContext(source,{validateEdition,isNewerEdition,URL,Request,Response,fetch:fetcher,caches,self:{addEventListener:(name,handler)=>{handlers[name]=handler}}});
  return {writes,request:async url=>{
    let response;const pending=[];
    handlers.fetch({request:new Request(url),respondWith:value=>{response=value},waitUntil:value=>pending.push(value)});
    const result=await response;await Promise.all(pending);return result;
  }};
}
test("service worker stores only a validated current edition",async()=>{
  const sw=worker(async()=>Response.json(sample));
  const response=await sw.request("https://example.com/data/cincinnati/current-weekend.json");
  assert.equal((await response.json()).events.length,sample.events.length);
  assert.equal(sw.writes.length,1);
});
test("malformed 200 response preserves last-good offline cache",async()=>{
  const sw=worker(async()=>Response.json({city:{id:"cincinnati"},weekend:{},events:[]}),Response.json(sample));
  const response=await sw.request("https://example.com/data/cincinnati/current-weekend.json");
  assert.equal((await response.json()).weekend.updatedAt,sample.weekend.updatedAt);
  assert.equal(sw.writes.length,0);
});
test("manual check rejects bad network data rather than reporting cached success",async()=>{
  const sw=worker(async()=>Response.json({bad:true}),Response.json(sample));
  await assert.rejects(sw.request("https://example.com/data/cincinnati/current-weekend.json?check=123"));
  assert.equal(sw.writes.length,0);
});
test("public publisher status is always fetched without service-worker caching",async()=>{
  let options;
  const sw=worker(async(_url,opts)=>{options=opts;return Response.json({state:"idle"})});
  await sw.request("https://raw.githubusercontent.com/owner/repo/refresh-control/status.json?check=1");
  assert.equal(options.cache,"no-store");assert.equal(sw.writes.length,0);
});
test("service worker upgrades preserve valid offline editions before claiming clients",async()=>{
  const handlers={},written=[],deleted=[];let claimed=false;
  const current={match:async()=>undefined,put:async(key,response)=>written.push({key,response})};
  const old={match:async key=>key.url.includes("/cincinnati/")?Response.json(sample):undefined};
  const caches={keys:async()=>["tw-shell-v4"],open:async name=>name==="tw-shell-v5"?current:old,delete:async name=>deleted.push(name)};
  runInNewContext(source,{validateEdition,isNewerEdition,URL,Request,Response,caches,self:{location:new URL("https://example.com/sw.js"),clients:{claim:async()=>{claimed=true}},addEventListener:(name,handler)=>{handlers[name]=handler}}});
  let promise;handlers.activate({waitUntil:value=>{promise=value}});await promise;
  assert.equal(written.length,1);assert.equal((await written[0].response.json()).city.id,"cincinnati");
  assert.deepEqual(deleted,["tw-shell-v4"]);assert.equal(claimed,true);
});
test("legacy cache migration never overwrites a newer validated current edition",async()=>{
  const handlers={},written=[];
  const newer=structuredClone(sample);newer.weekend.updatedAt=new Date(Date.parse(sample.weekend.updatedAt)+86400000).toISOString();
  const current={match:async key=>key.url.includes("/cincinnati/")?Response.json(newer):undefined,put:async(key,response)=>written.push({key,response})};
  const old={match:async key=>key.url.includes("/cincinnati/")?Response.json(sample):undefined};
  const caches={keys:async()=>["tw-shell-v4"],open:async name=>name==="tw-shell-v5"?current:old,delete:async()=>true};
  runInNewContext(source,{validateEdition,isNewerEdition,URL,Request,Response,caches,self:{location:new URL("https://example.com/sw.js"),clients:{claim:async()=>{}},addEventListener:(name,handler)=>{handlers[name]=handler}}});
  let promise;handlers.activate({waitUntil:value=>{promise=value}});await promise;
  assert.equal(written.length,0);
});
