import {type OperationDefinition, type RelationalContributor} from "@super-app/relational-engine/Depth0/Contracts/relational-contributor";
import {type OperationInvocation} from "@super-app/relational-engine/Depth0/Contracts/operation-graph";
export {parsePersonalProfile, parsePersonalProfileSnapshot} from './Depth0/Template/profile-values.ts';
import { readFile, writeFile, mkdir, rename, rm, open, type FileHandle } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';

import { emptyPersonalProfile, parsePersonalProfile, type PersonalProfile, type PersonalProfileSnapshot } from './Depth0/Template/profile-values.ts';
const json = 'application/json';
const revisionOf = (text: string) => createHash('sha256').update(text).digest('hex');

export function createPersonalVault({ storagePath }: Readonly<{storagePath: string}>) {
  async function read(): Promise<PersonalProfileSnapshot> {
    try {
      const text = await readFile(storagePath, 'utf8');
      return { values: parsePersonalProfile(JSON.parse(text)), revision: revisionOf(text) };
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return {
        values: emptyPersonalProfile(), revision: 'missing',
      };
      throw error;
    }
  }
  async function save(data: PersonalProfile, expectedRevision: string): Promise<PersonalProfileSnapshot> {
    if (typeof expectedRevision !== 'string' || !expectedRevision)
      throw Error('Read personal information before saving; an expected revision is required.');
    const values = parsePersonalProfile(data);
    await mkdir(dirname(storagePath), { recursive: true });
    const lockPath = storagePath + '.lock';
    let lock: FileHandle;
    try { lock = await open(lockPath, 'wx'); }
    catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'EEXIST') throw Error('Personal information is being saved elsewhere. Try again after that save finishes.');
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
  const output = (data: PersonalProfileSnapshot) => ({ outputs: { result: { type: json, data } } });
  const contributor = {
    id: 'personal-vault', label: 'Personal information',
    contribute({ rootGraphId }) { return { componentTypes: [], edgeTypes: [], rootNodes: [], rootEdges: [], graphs: [{ id: rootGraphId, title: 'Personal information', caption: 'Personal information stored by this composition.', levelLabel: 'Profile', worldWidth: 800, worldHeight: 600, nodes: [], edges: [] }] }; },
    operationDefinitions() { return [
      { descriptor: { id: 'personal-vault:read', label: 'Read personal information', inputs: [], outputs: [{ id: 'result', label: 'Profile snapshot', channel: 'data', valueType: json }] }, execute: async () => output(await read()) },
      { descriptor: { id: 'personal-vault:save', label: 'Save personal information', inputs: [
        { id: 'profile', label: 'Profile', channel: 'data', valueType: json, literal: { kind: 'json', defaultValue: {} } },
        { id: 'expectedRevision', label: 'Revision read before editing', channel: 'data', valueType: json, literal: { kind: 'json', defaultValue: null } },
      ], outputs: [{ id: 'result', label: 'Saved profile snapshot', channel: 'data', valueType: json }] }, execute(request: OperationInvocation) {
        const input = request.inputs['profile'], revision = request.inputs['expectedRevision'];
        if (!input || !('type' in input) || input.type !== json) throw Error('Profile requires JSON.');
        if (!revision || !('type' in revision) || revision.type !== json || typeof revision.data !== 'string') throw Error('Expected profile revision is required.');
        return save(parsePersonalProfile(input.data), revision.data).then(output);
      } },
    ] satisfies readonly OperationDefinition[]; },
  } satisfies RelationalContributor;
  return {...contributor, read, save};
}

