import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("manual freshness validation scopes one city while weekly validation covers all", () => {
  const directory=mkdtempSync(join(tmpdir(),"weekend-validator-"));
  try {
    mkdirSync(join(directory,"scripts"));
    writeFileSync(join(directory,"edition-status.js"),readFileSync(new URL("../edition-status.js",import.meta.url)));
    writeFileSync(join(directory,"scripts/validate-weekend-data.mjs"),readFileSync(new URL("../scripts/validate-weekend-data.mjs",import.meta.url)));
    for(const city of ["cincinnati","philadelphia","chicago","washington-dc"]){
      const data=JSON.parse(readFileSync(new URL(`../data/${city}/current-weekend.json`,import.meta.url),"utf8"));
      data.weekend.startDate=city==="cincinnati"?"2099-01-01":"2000-01-01";
      data.weekend.endDate=city==="cincinnati"?"2099-01-03":"2000-01-03";
      // Freeze the validator's date to a known fixture; source data still undergoes all other checks.
      data.events=data.events.map((event,index)=>({...event,date:city==="cincinnati"?"2099-01-02":"2000-01-02",title:`${event.title} ${index}`}));
      mkdirSync(join(directory,"data",city),{recursive:true});
      writeFileSync(join(directory,"data",city,"current-weekend.json"),JSON.stringify(data));
    }
    writeFileSync(join(directory,"clock.mjs"),`const NativeDate=Date;globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:["2099-01-02T18:00:00Z"]))}static now(){return NativeDate.parse("2099-01-02T18:00:00Z")}};`);
    const script=join(directory,"scripts/validate-weekend-data.mjs");
    const options={encoding:"utf8",stdio:"pipe"};
    const result=execFileSync(process.execPath,["--import",join(directory,"clock.mjs"),script,"--city","cincinnati"],options);
    assert.match(result,/PASS cincinnati/);
    assert.doesNotMatch(result,/philadelphia/);
    assert.throws(()=>execFileSync(process.execPath,["--import",join(directory,"clock.mjs"),script],options),error=>{
      assert.match(String(error.stderr),/philadelphia: edition expired/);
      assert.match(String(error.stderr),/chicago: edition expired/);
      return true;
    });
    assert.throws(()=>execFileSync(process.execPath,[script,"--city","bad-city"],options),error=>String(error.stderr).includes("Unsupported city"));
  } finally {rmSync(directory,{recursive:true,force:true});}
});
