import { parseEngineResponse } from "@super-app/relational-engine/Depth15/EngineExchange/parseEngineResponse";
import type { EngineRequest } from "@super-app/relational-engine/Depth8/Contracts/EngineRequest";
import type { OperationInvocation } from "@super-app/relational-engine/Depth1/Contracts/OperationInvocation";
import { start } from "@super-app/application/runtime/source";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { composePersonalConfiguration } from "./configuration.ts";
import { parsePersonalProfileSnapshot } from "./vault.ts";

async function invoke(origin:string,token:string,invocation:OperationInvocation):Promise<unknown> {
 const request:EngineRequest={kind:'invoke',invocation};
 const response=await fetch(origin+'/engine',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(request)});
 const value:unknown=await response.json();
 if(!response.ok)throw Error('Engine request failed: '+JSON.stringify(value));
 const parsed=parseEngineResponse(value,request);
 if(parsed.kind!=='invoke')throw Error('Expected an operation result.');
 const output=parsed.result.outputs['result'];if(!output||!('data' in output))throw Error('Expected data result.');return output.data;
}

test("personal information saved in a preview stays out of production", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "perso-preview-"));
  const app = await start({
    root,
    port: 0,
    configure:(base,context)=>composePersonalConfiguration(base,{profilePath:path.join(context.storageDirectory,'profile.json')}),
    adapter: { models: [], create: async () => { throw Error("Agent execution is outside this test."); } },
  });
  try {
    const previews = app.previews;if(!previews)throw Error('The application has no preview manager.');
    const preview = await previews.create();
    const initial=parsePersonalProfileSnapshot(await invoke(preview.origin,preview.app.token,{operationId:'personal-vault:read',inputs:{}}));
    const saved=parsePersonalProfileSnapshot(await invoke(preview.origin,preview.app.token,{operationId:'personal-vault:save',inputs:{profile:{type:'application/json',data:{...initial.values,experience:['Preview only']}},expectedRevision:{type:'application/json',data:initial.revision}}}));
    assert.deepEqual(saved.values.experience,['Preview only']);
    const original=parsePersonalProfileSnapshot(await invoke(new URL(app.url).origin,app.token,{operationId:'personal-vault:read',inputs:{}}));
    assert.notDeepEqual(original.values.experience,['Preview only']);
  } finally {
    await app.close();
    await rm(root, { recursive: true, force: true });
  }
});
