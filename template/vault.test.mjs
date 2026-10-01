import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import os from 'node:os';
import { createPersonalVault } from './vault.mjs';
const run = promisify(execFile);
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'personal-vault-'));
  const storagePath = path.join(root, 'profile.json');
  return { root, storagePath, vault: createPersonalVault({ storagePath }), close: () => rm(root, { recursive: true, force: true }) };
}

test('stale or missing revisions cannot overwrite another client and valid revisions advance', async () => {
  const f = await fixture();
  try {
    const other = createPersonalVault({ storagePath: f.storagePath });
    const first = await f.vault.read(), stale = await other.read();
    first.values.experience = ['First client update'];
    const saved = await f.vault.save(first.values, first.revision);
    assert.notEqual(saved.revision, first.revision);
    stale.values.learning = ['Stale client update'];
    await assert.rejects(other.save(stale.values, stale.revision), /changed since/);
    await assert.rejects(other.save(stale.values), /expected revision/);
    assert.deepEqual(await other.read(), saved);
    saved.values.learning = ['Current client update'];
    const next = await other.save(saved.values, saved.revision);
    assert.deepEqual((await f.vault.read()).values, next.values);
    assert.notEqual(next.revision, saved.revision);
    assert.deepEqual(await readdir(f.root), ['profile.json']);
  } finally { await f.close(); }
});

test('separate processes cannot both save the same revision', async () => {
  const f = await fixture();
  try {
    const initial = await f.vault.read();
    const moduleUrl = new URL('./vault.mjs', import.meta.url).href;
    const source = `import {createPersonalVault} from ${JSON.stringify(moduleUrl)};
      const vault=createPersonalVault({storagePath:process.argv[1]});
      const values=JSON.parse(process.argv[3]);
      try {const result=await vault.save(values,process.argv[2]);console.log(JSON.stringify({saved:true,values:result.values}));}
      catch(error){console.log(JSON.stringify({saved:false,message:error.message}));}`;
    const attempts = await Promise.all(['First', 'Second'].map(async label => {
      const values = {...initial.values, experience: [label]};
      const result = await run(process.execPath, ['--input-type=module', '-e', source, f.storagePath, initial.revision, JSON.stringify(values)], {windowsHide: true});
      return JSON.parse(result.stdout);
    }));
    assert.equal(attempts.filter(result => result.saved).length, 1);
    assert.match(attempts.find(result => !result.saved).message, /changed since|being saved elsewhere/);
    assert.deepEqual((await f.vault.read()).values, attempts.find(result => result.saved).values);
    assert.deepEqual(await readdir(f.root), ['profile.json']);
  } finally { await f.close(); }
});

test('an existing save lock is never overwritten or removed', async () => {
  const f = await fixture();
  try {
    const initial = await f.vault.read();
    await writeFile(f.storagePath + '.lock', 'Other process owns this lock');
    await assert.rejects(f.vault.save(initial.values, initial.revision), /being saved elsewhere/);
    assert.equal(await readFile(f.storagePath + '.lock', 'utf8'), 'Other process owns this lock');
    assert.deepEqual(await f.vault.read(), initial);
  } finally { await f.close(); }
});

test('relational operations require and return the same revision contract', async () => {
  const f = await fixture();
  try {
    const definitions = f.vault.operationDefinitions();
    const read = definitions.find(operation => operation.descriptor.id === 'personal-vault:read');
    const save = definitions.find(operation => operation.descriptor.id === 'personal-vault:save');
    const initial = (await read.execute()).outputs.result.data;
    const profile = {type: 'application/json', data: {...initial.values, goals: ['Useful software']}};
    assert.throws(() => save.execute({inputs: {profile}}), /Expected profile revision/);
    const result = await save.execute({inputs: {profile, expectedRevision: {type: 'application/json', data: initial.revision}}});
    assert.deepEqual(result.outputs.result.data, await f.vault.read());
    await assert.rejects(save.execute({inputs: {profile, expectedRevision: {type: 'application/json', data: initial.revision}}}), /changed since/);
  } finally { await f.close(); }
});
