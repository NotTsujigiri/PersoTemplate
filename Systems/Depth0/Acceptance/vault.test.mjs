import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createPersonalVault} from '@perso/template/vault';
test('personal information persists structured lists and rejects unsupported fields',async t=>{
 const root=await mkdtemp(join(tmpdir(),'personal-vault-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const options={storagePath:join(root,'profile.json')};const operations=createPersonalVault(options).operationDefinitions();
 const read=()=>operations[0].execute();const save=value=>operations[1].execute({inputs:{profile:{type:'application/json',data:value}}});
 const initial=(await read()).outputs.result.data;const value={...initial,experience:['Desktop development'],goals:['Choose meaningful projects']};
 await save(value);
 const reopened=await createPersonalVault(options).operationDefinitions()[0].execute();assert.deepEqual(reopened.outputs.result.data,value);
 assert.throws(()=>save({...value,password:'unrelated'}),/Unsupported/);
 assert.throws(()=>save({...value,goals:'not a list'}),/list/);
 assert.deepEqual((await read()).outputs.result.data,value);
});


test('host adapter and relational operations share the same personal vault',async t=>{
 const root=await mkdtemp(join(tmpdir(),'personal-vault-host-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const vault=createPersonalVault({storagePath:join(root,'profile.json')});
 const profile={...await vault.read(),learning:['Native contribution tools']};
 await vault.save(profile);
 const operations=vault.operationDefinitions();
 assert.deepEqual((await operations[0].execute()).outputs.result.data,profile);
 const updated={...profile,goals:['Keep my information across templates']};
 await operations[1].execute({inputs:{profile:{type:'application/json',data:updated}}});
 assert.deepEqual(await vault.read(),updated);
 assert.throws(()=>vault.save({...updated,learning:['']}),/non-empty/);
 assert.deepEqual(await vault.read(),updated);
});
