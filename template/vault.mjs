import { readFile, writeFile, mkdir, rename, rm, open } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { profileFields } from './dist/profile-fields.js';
const json = 'application/json';
const revisionOf = text => createHash('sha256').update(text).digest('hex');

export function createPersonalVault({ storagePath }) {
  function validate(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !profileFields.some(field => field.key === key)))
      throw Error('Unsupported personal information fields.');
    for (const field of profileFields)
      if (!Array.isArray(value[field.key]) || !value[field.key].every(item => typeof item === 'string' && item.trim()))
        throw Error(`${field.label} requires a list of non-empty strings.`);
    return Object.fromEntries(profileFields.map(field => [field.key, [...value[field.key]]]));
  }
  async function read() {
    try {
      const text = await readFile(storagePath, 'utf8');
      return { values: validate(JSON.parse(text)), revision: revisionOf(text) };
    } catch (error) {
      if (error.code === 'ENOENT') return {
        values: Object.fromEntries(profileFields.map(field => [field.key, []])), revision: 'missing',
      };
      throw error;
    }
  }
  async function save(data, expectedRevision) {
    if (typeof expectedRevision !== 'string' || !expectedRevision)
      throw Error('Read personal information before saving; an expected revision is required.');
    const values = validate(data);
    await mkdir(dirname(storagePath), { recursive: true });
    const lockPath = storagePath + '.lock';
    let lock;
    try { lock = await open(lockPath, 'wx'); }
    catch (error) {
      if (error.code === 'EEXIST') throw Error('Personal information is being saved elsewhere. Try again after that save finishes.');
      throw error;
    }
    const temporary = storagePath + '.' + randomUUID() + '.tmp';
    try {
      const current = await read();
      if (current.revision !== expectedRevision)
        throw Error('Personal information changed since it was loaded. Reload it before saving; your edit has not overwritten the newer version.');
      const text = JSON.stringify(values, null, 2) + '\n';
      await writeFile(temporary, text, { flag: 'wx' });
      await rename(temporary, storagePath);
      return { values, revision: revisionOf(text) };
    } finally {
      try { await rm(temporary, { force: true }); }
      finally { await lock.close(); await rm(lockPath); }
    }
  }
  const output = data => ({ outputs: { result: { type: json, data } } });
  return {
    read, save, id: 'personal-vault', label: 'Personal information',
    contribute({ rootGraphId }) { return { nodeTypes: [], edgeTypes: [], rootNodes: [], rootEdges: [], graphs: [{ id: rootGraphId, title: 'Personal information', caption: 'Personal information stored by this composition.', levelLabel: 'Profile', worldWidth: 800, worldHeight: 600, nodes: [], edges: [] }] }; },
    operationDefinitions() { return [
      { descriptor: { id: 'personal-vault:read', label: 'Read personal information', inputs: [], outputs: [{ id: 'result', label: 'Profile snapshot', channel: 'data', valueType: json }] }, execute: async () => output(await read()) },
      { descriptor: { id: 'personal-vault:save', label: 'Save personal information', inputs: [
        { id: 'profile', label: 'Profile', channel: 'data', valueType: json, literal: { kind: 'json', defaultValue: {} } },
        { id: 'expectedRevision', label: 'Revision read before editing', channel: 'data', valueType: json, literal: { kind: 'json', defaultValue: null } },
      ], outputs: [{ id: 'result', label: 'Saved profile snapshot', channel: 'data', valueType: json }] }, execute(request) {
        const input = request.inputs.profile, revision = request.inputs.expectedRevision;
        if (!input || input.type !== json) throw Error('Profile requires JSON.');
        if (!revision || revision.type !== json || typeof revision.data !== 'string') throw Error('Expected profile revision is required.');
        return save(input.data, revision.data).then(output);
      } },
    ]; },
  };
}
