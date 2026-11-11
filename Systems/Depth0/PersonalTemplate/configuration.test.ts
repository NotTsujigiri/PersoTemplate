import { createConfiguredEngine } from "@super-app/relational-engine/Depth18/EngineConfiguration/createConfiguredEngine";
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {createDefaultApplicationConfiguration,composeApplicationConfiguration} from '@super-app/default-super-app-template/application-configuration';
import {composePersonalConfiguration} from './configuration.ts';
import {parsePersonalProfileSnapshot} from './vault.ts';

test('the personal configuration stacks Default, Btr and personal templates and its vault',async t=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'perso-config-'));t.after(()=>rm(directory,{recursive:true,force:true}));
 const base=createDefaultApplicationConfiguration({options:{id:'fixture'},contributors:[]});
 const configured=composePersonalConfiguration(base,{profilePath:path.join(directory,'profile.json')});
 assert.deepEqual(base.templates.map(template=>template.id),['default']);assert.deepEqual(base.service.contributors,[]);
 assert.deepEqual(configured.templates.map(template=>template.id),['default','btr-organisation','personal']);
 assert.equal(configured.startupTemplateId,'default');
 assert.throws(()=>composeApplicationConfiguration(configured,{templates:[{id:'personal',label:'Conflict',browser:{specifier:'fixture/module',url:'file:///fixture.ts'}}]}),/Conflicting template/);
 assert.throws(()=>composeApplicationConfiguration(configured,{contributors:[{id:'personal-vault',label:'Conflict',enabled:true,startup:'lazy',load:()=>{throw Error('Composition must not load.');}}]}),/Conflicting contributor/);
 const engine=createConfiguredEngine(configured.service);t.after(()=>engine.stop());await engine.start();
 const result=await engine.invokeOperation({operationId:'personal-vault:read',inputs:{}});
 const output=result.outputs['result'];if(!output||!('data' in output))throw Error('Expected profile data.');
 assert.equal(parsePersonalProfileSnapshot(output.data).revision,'missing');
});
