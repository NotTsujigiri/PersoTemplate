import type {ApplicationTemplate,ApplicationTemplateContext} from '@super-app/default-super-app-template/application-contract';
import type {NavigationContext} from '@super-app/default-super-app-template/navigation';
import {createUserChannels,parsePersonalProfileSnapshot,type PersonalTemplateOptions} from './channels.js';
import {createApplicationTemplate as createDefaultTemplate} from '@super-app/default-super-app-template/application/source';

export function createApplicationTemplate(context:ApplicationTemplateContext):ApplicationTemplate {
 let revision:string|undefined;
 const options:PersonalTemplateOptions<NavigationContext>={...context,personalInformation:{
  read:async()=>{const result=await context.service.invokeOperation({operationId:'personal-vault:read',inputs:{}});const snapshot=parsePersonalProfileSnapshot(result.outputs['result']?.data);revision=snapshot.revision;return snapshot.values;},
  save:async values=>{if(!revision)throw Error('Read personal information before saving.');const result=await context.service.invokeOperation({operationId:'personal-vault:save',inputs:{profile:{type:'application/json',data:values},expectedRevision:{type:'application/json',data:revision}}});revision=parsePersonalProfileSnapshot(result.outputs['result']?.data).revision;},
 }};
 return {...createDefaultTemplate(context),userChannels:createUserChannels(options)};
}
