import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {composePersonalConfiguration} from './configuration.ts';
import type {ApplicationRuntime} from '@super-app/application/runtime/source';
import {runApplicationCommand} from '@super-app/application/node-entry/source';
import {startPrivateApplication,type PrivateApplicationOptions} from '@super-app/application/private-application/source';

/** The repository this application starts from: `npm start` runs in PersoTemplate's root. */
const root=fileURLToPath(new URL('../../../',import.meta.url)),application='personal';

/** Start the personal application: the Broccoli's templates, Btr Organisation and Perso with the user's private space. */
export function start(options:Omit<PrivateApplicationOptions,'application'>={}):Promise<ApplicationRuntime> {
 const inheritedReady=options.browserReady,configure=options.configure;
 return startPrivateApplication({...options,application,root:options.root??root,
  browserReady:async page=>{
   await page.waitForFunction(()=>![...document.querySelectorAll('[aria-label="Personal information"]')].some(node=>node.textContent==='Loading personal information…'),null,{timeout:20000});
   await inheritedReady?.(page);
  },
  configure:(base,context)=>{
   const configured=composePersonalConfiguration(base,{profilePath:path.join(context.storageDirectory,'personal-information.json')});
   return configure?configure(configured,context):configured;
  },
 });
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 await runApplicationCommand(start,{application,root,port:43130},process.argv.slice(2));
