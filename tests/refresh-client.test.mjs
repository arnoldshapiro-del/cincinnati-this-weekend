import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { requestResearchRefresh, validateRefreshStatus, matchesPublishedEdition } from "../refresh-client.js";

const original = JSON.parse(await readFile(new URL("../data/cincinnati/current-weekend.json", import.meta.url), "utf8"));
// The checked-in edition advances weekly; keep this request's previously loaded guide deterministic.
original.weekend = { ...original.weekend, startDate: "2026-10-03", endDate: "2026-10-04", updatedAt: "2026-10-03T21:00:00Z", editionId: "previous-edition" };
const instant = Date.parse("2026-10-10T22:00:00Z");
const config = { enabled: true, statusUrl: "https://example.com/status.json", pollIntervalMs: 10000, pollWindowMs: 40000 };
function status(state, extra={}) {
  return { schemaVersion: 1, jobId: "job-1", state, cities: ["cincinnati"], targetWeekends: { cincinnati: { startDate: "2026-10-09", endDate: "2026-10-11" } }, startedAt: new Date(instant).toISOString(), leaseExpiresAt: new Date(instant+3600000).toISOString(), nextAllowedAt: new Date(instant+3600000).toISOString(), publication: state === "succeeded" ? {commitSha:"a".repeat(40),deployId:"deploy1",verifiedAt:new Date(instant+20000).toISOString(),editions:{cincinnati:{editionId:"test-edition",startDate:"2026-10-09",endDate:"2026-10-11",updatedAt:new Date(instant+20000).toISOString()}}} : null, ...extra };
}
function freshData() {
  const data = structuredClone(original);
  data.weekend = { ...data.weekend, editionId:"test-edition",startDate: "2026-10-09", endDate: "2026-10-11", updatedAt: new Date(instant+20000).toISOString() };
  data.events = data.events.map(event => ({ ...event, date: "2026-10-10" }));
  return data;
}
function fixture(statuses, {postOk=true, enabled=true}={}) {
  let clock=instant;
  const calls=[], progress=[];
  let sequence=0;
  const fetcher=async (url,options={})=>{
    calls.push({url:String(url),options});
    if(options.method==="POST")return {ok:postOk,status:postOk?200:503};
    if(String(url).includes("status.json"))return {ok:true,json:async()=>statuses[Math.min(sequence++,statuses.length-1)]};
    return {ok:true,json:async()=>freshData()};
  };
  return {calls,progress,run:()=>requestResearchRefresh({city:"cincinnati",currentWeekend:original.weekend,dataUrl:"./data/cincinnati/current-weekend.json",config:{...config,enabled},fetcher,now:()=>clock,sleep:async ms=>{clock+=ms},requestId:"request-1",baseUrl:"https://example.com/",onProgress:value=>progress.push(value.state)})};
}
test("form acceptance is distinct from source research and verified live publication",async()=>{
  const f=fixture([{schemaVersion:1,state:"idle"},status("queued"),status("gathering"),status("succeeded")]);
  const result=await f.run();
  assert.equal(result.state,"succeeded");
  assert.deepEqual(f.progress,["accepted","queued","gathering","succeeded"]);
  const post=f.calls.find(call=>call.options.method==="POST");
  assert.deepEqual(Object.fromEntries(new URLSearchParams(post.options.body)),{"form-name":"weekend-refresh",city:"cincinnati",requestId:"request-1",requestedWeekendStart:"2026-10-09","bot-field":""});
  assert.ok(f.calls.some(call=>call.url.includes("current-weekend.json?check=")));
});
test("accepted form without a matching publisher run stays pending, never succeeds",async()=>{
  const f=fixture([{schemaVersion:1,state:"idle"}]);
  assert.equal((await f.run()).state,"pending");
  assert.deepEqual(f.progress,["accepted"]);
});
test("matching active work is joined without a duplicate form submission",async()=>{
  const f=fixture([status("gathering"),status("succeeded")]);
  assert.equal((await f.run()).state,"succeeded");
  assert.equal(f.calls.filter(call=>call.options.method==="POST").length,0);
});
test("another city's active run is not claimed as research for this city",async()=>{
  const f=fixture([status("gathering",{cities:["chicago"],targetWeekends:{chicago:{startDate:"2026-10-09",endDate:"2026-10-11"}}})]);
  assert.equal((await f.run()).state,"busy");
  assert.equal(f.calls.some(call=>call.options.method==="POST"),false);
});
test("global rolling cooldown does not submit another research request",async()=>{
  const f=fixture([status("succeeded")]);
  assert.equal((await f.run()).state,"cooldown");
  assert.equal(f.calls.some(call=>call.options.method==="POST"),false);
});
test("failed research returns failure without loading replacement data",async()=>{
  const f=fixture([{schemaVersion:1,state:"idle"},status("failed")]);
  assert.equal((await f.run()).state,"failed");
  assert.equal(f.calls.some(call=>call.url.includes("current-weekend.json")),false);
});
test("disabled or unconfigured integration cannot silently pretend to request research",async()=>{
  const f=fixture([],{enabled:false});
  await assert.rejects(f.run(),/not enabled/);
  assert.equal(f.calls.length,0);
});
test("failed form POST is not automatically retried",async()=>{
  const f=fixture([{schemaVersion:1,state:"idle"}],{postOk:false});
  await assert.rejects(f.run(),/503/);
  assert.equal(f.calls.filter(call=>call.options.method==="POST").length,1);
});
test("malformed public status cannot indicate a successful job",()=>{
  assert.equal(validateRefreshStatus({schemaVersion:1,state:"succeeded"}),null);
  assert.equal(validateRefreshStatus(status("unknown")),null);
  assert.equal(validateRefreshStatus(status("gathering",{cities:["untrusted-city"]})),null);
});

test("completion matches the exact published identity, never an intermediate cached guide",()=>{
 const data=freshData(), job=status("succeeded"), target={startDate:"2026-10-09",endDate:"2026-10-11"};
 assert.equal(matchesPublishedEdition(data,job,"cincinnati",target),true);
 assert.equal(matchesPublishedEdition({...data,weekend:{...data.weekend,updatedAt:data.weekend.updatedAt.replace(".000Z","Z")}},job,"cincinnati",target),true);
 assert.equal(matchesPublishedEdition({...data,weekend:{...data.weekend,editionId:"intermediate"}},job,"cincinnati",target),false);
 assert.equal(matchesPublishedEdition({...data,weekend:{...data.weekend,updatedAt:"2026-10-10T22:00:10Z"}},job,"cincinnati",target),false);
 const partial={...data,weekend:{...data.weekend,startDate:"2026-10-10"}};
 job.publication.editions.cincinnati.startDate="2026-10-10";
 assert.equal(matchesPublishedEdition(partial,job,"cincinnati",target),true);
});

test("a concurrent other-city winner is busy, not an indefinitely pending request",async()=>{
 const f=fixture([{schemaVersion:1,state:"idle"},status("gathering",{cities:["chicago"],targetWeekends:{chicago:{startDate:"2026-10-09",endDate:"2026-10-11"}}})]);
 assert.equal((await f.run()).state,"busy");
});
test("a worker with an expired lease is not described as running",async()=>{
 const f=fixture([{schemaVersion:1,state:"idle"},status("gathering",{leaseExpiresAt:new Date(instant-1).toISOString()})]);
 assert.equal((await f.run()).state,"stalled");
 assert.deepEqual(f.progress,["accepted"]);
});
test("no publisher evidence stays explicitly unconfirmed",async()=>{
 const f=fixture([{schemaVersion:1,state:"idle"}]);
 const result=await f.run();
 assert.equal(result.state,"pending");
 assert.equal(result.publisherStarted,false);
});
