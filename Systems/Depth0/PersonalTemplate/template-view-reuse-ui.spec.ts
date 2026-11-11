import {expect,test} from './file-application.test-support.ts';
import {writeFile} from 'node:fs/promises';

test('a contributed personal view mounts in another layout without its template navigation',async({page},info)=>{
 await page.goto('/');await expect(page.locator('#prompt')).toBeEnabled();
 const actual=await page.evaluate(async()=>{
  const {frontendGraph,serviceEngine}=await import('/components/frontend-graph.js');
  const {readApplicationCatalog,configuredApplicationTemplate}=await import('/components/application-contract.js');
  const service=await serviceEngine();
  const response=await service.invokeOperation({operationId:'application:catalog',inputs:{}});
  const catalog=readApplicationCatalog(response.outputs['catalog']?.data);
  const owner=catalog.templates.find(template=>template.id==='personal');if(!owner)throw Error('Personal template is unavailable.');
  const supplied=configuredApplicationTemplate(owner.moduleUrl).createApplicationTemplate({
   engine:frontendGraph,service,buildspaces:[],spaces:[],
   createContributionSurface:()=>{throw Error('The reused view must not require the owning navigation.');},
  });
  const view=supplied.userChannels.find(channel=>channel.id==='personal-information');if(!view)throw Error('Personal information view is unavailable.');
  const host=document.createElement('section');host.setAttribute('aria-label','Independent view composition');
  host.style.cssText='position:fixed;inset:80px 120px;background:var(--background,#222);z-index:9999;overflow:auto';
  host.append(view.create({host,descriptor:{id:'independent-consumer',label:'Independent consumer',moduleUrl:owner.moduleUrl},templates:[],selectTemplate:async()=>{throw Error('The view cannot activate its owning template.');}}));
  document.body.append(host);
  return {view:view.id,navigationRequired:supplied.communities.length>0};
 });
 const host=page.getByRole('region',{name:'Independent view composition',exact:true});
 await expect(host.getByRole('form',{name:'Personal information',exact:true})).toBeVisible();
 await expect(host.getByRole('button',{name:'Save',exact:true})).toBeVisible();
 const expected={view:'personal-information',navigationRequired:false};
 await writeFile(info.outputPath('actual.json'),JSON.stringify(actual,null,2));
 await writeFile(info.outputPath('expected.json'),JSON.stringify(expected,null,2));
 expect(actual).toEqual(expected);
 await page.screenshot({path:info.outputPath('independent-view.png')});
});
