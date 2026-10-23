import {composeBtrConfiguration} from '@btr/template/configuration';
import {browserModule,composeApplicationConfiguration,type ApplicationConfiguration,type ApplicationTemplateRegistration} from '@super-app/default-super-app-template/application-configuration';
import {createPersonalVault} from './vault.js';

const template:ApplicationTemplateRegistration={id:'personal',label:'Perso',browser:browserModule('@perso/template/application/source',import.meta.resolve),spaces:[{id:'private',label:'Private',description:'Your personal channels',kind:'private',includeOwnedBuildspaces:true,buildspaceIds:[]}]};
export function composePersonalConfiguration(base:ApplicationConfiguration,options:Readonly<{profilePath:string}>):ApplicationConfiguration {
 return composeApplicationConfiguration(composeBtrConfiguration(base),{templates:[template],contributors:[{id:'personal-vault',label:'Personal information',enabled:true,required:true,startup:'lazy',load:()=>createPersonalVault({storagePath:options.profilePath})}]});
}
