import path from 'node:path';
import os from 'node:os';


import {composePersonalConfiguration} from './configuration.ts';
import {start as startHost,type StartOptions,type ApplicationRuntime} from '@super-app/application/runtime/source';
import {openPrivateSpaceRepository} from '@super-app/default-super-app-template/private-space/source';
import {createPrivateSpaceRecovery} from '@super-app/default-super-app-template/private-space-recovery/source';
import {browserModule,composeApplicationConfiguration} from '@super-app/default-super-app-template/application-configuration';

/** Compose the personal application and restore its private space through the Broccoli's application runner. */
export async function start(options:StartOptions&{home?:string}={}):Promise<ApplicationRuntime> {
 const inheritedReady=options.browserReady;
 options={...options,browserReady:async page=>{
  await page.waitForFunction(()=>![...document.querySelectorAll('[aria-label="Personal information"]')].some(node=>node.textContent==='Loading personal information…'),null,{timeout:20000});
  await inheritedReady?.(page);
 }};
 const home=options.home??os.homedir(),root=options.root??process.cwd();
 const compose:NonNullable<StartOptions['configure']>=(base,context)=>{
  const configured=composePersonalConfiguration(base,{profilePath:path.join(context.storageDirectory,'personal-information.json')});
  return options.configure?options.configure(configured,context):configured;
 };
 if(options.previewRuntime)return startHost({...options,root,configure:compose});
 const repository=await openPrivateSpaceRepository(home,root);
 let runtime:ApplicationRuntime|undefined;
 const loaded=await repository.load().then(space=>({kind:'ready',space} as const),(error:unknown)=>({kind:'recovery',message:error instanceof Error?error.message:String(error)} as const));
 if(loaded.kind==='ready'){
  const space=loaded.space;
  runtime=await startHost({...options,root,store:options.store??repository.storageDirectory,configure:(base,context)=>compose({...base,initialBuildspaces:space.buildspaces,templates:base.templates.map(template=>template.id==='default'?{...template,spaces:[{id:space.id,label:space.label,description:'Your private space',kind:'private',includeOwnedBuildspaces:true,buildspaceIds:[]}]}:template)},context)});
 }else{
  const recovery=createPrivateSpaceRecovery(repository,loaded.message,()=>{if(!runtime)throw Error('Application startup is still in progress.');runtime.requestRestart();});
  runtime=await startHost({...options,root,store:path.join(home,'.config','TheBroccoli','recovery'),recoveryRuntime:true,configure:base=>composeApplicationConfiguration({...base,initialBuildspaces:[],templates:[{id:'recovery',label:'Recovery',browser:browserModule('@super-app/default-super-app-template/private-space-recovery-view/source',import.meta.resolve)}],startupTemplateId:'recovery'},{contributors:[{id:recovery.id,label:recovery.label,enabled:true,required:true,startup:'bootstrap',load:()=>recovery}]})});
 }
 return runtime;
}
