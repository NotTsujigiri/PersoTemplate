import { test, expect, runBrowserRecordedScenario } from '@super-app/browser-test-support';
test('reviewed navigation supports nested channels and persistent cross-template pins', async ({page}, info) => {
 await runBrowserRecordedScenario(page, info, [
  {label:'Personal composition offers Perso then Btr then Default', execute:async()=>{
   await page.goto('http://127.0.0.1:43122/?token=local-super-app-review');
   await expect(page.getByRole('navigation',{name:'Private spaces and communities',exact:true}).getByRole('button',{name:'Private space',exact:true})).toBeVisible();
   await page.getByRole('button',{name:'Active template',exact:true}).click();
   await expect(page.getByRole('menuitemradio')).toHaveText(['Perso','Btr Organisation','Default']);
  }},
  {label:'Manage pins lists unopened templates without navigating away', execute:async()=>{
   await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Pinned channels',exact:true}).click({button:'right'});
   await expect(page.getByRole('checkbox',{name:'Pin Space game',exact:true})).not.toBeChecked();
   await expect(page.getByRole('checkbox',{name:'Pin Default',exact:true})).toBeVisible();
   await expect(page.getByRole('navigation',{name:'Private spaces and communities',exact:true}).getByRole('button',{name:'Private space',exact:true})).toBeVisible();
  }},
  {label:'Btr owns three project channels inside Systems', execute:async()=>{
   await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Active template',exact:true}).click();
   await page.getByRole('menuitemradio',{name:'Btr Organisation',exact:true}).click();
   const channels = page.getByRole('navigation',{name:'Channels',exact:true});
   await expect(channels.getByRole('heading')).toHaveCount(0);
   await expect(channels.locator('.channel-children').getByRole('button')).toHaveText(['The Broccoli','Space game','EDF mods']);
   await page.getByRole('button',{name:'EDF mods',exact:true}).click();
   await expect(page.getByRole('heading',{name:'EDF mods',exact:true})).toBeVisible();
  }},
  {label:'Pin Space game for access across templates', execute:async()=>{
   await page.getByRole('button',{name:'Space game',exact:true}).click();
   await page.getByRole('button',{name:'Pinned channels',exact:true}).click({button:'right'});
   await page.getByRole('checkbox',{name:'Pin Space game',exact:true}).check();
   await page.getByRole('button',{name:'Done',exact:true}).click();
   await expect(page.getByRole('region',{name:'Pinned channels',exact:true}).getByRole('button',{name:'Space game',exact:true})).toBeVisible();
  }},
  {label:'Reload Perso and open its saved cross-template pin', execute:async()=>{
   await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Expand Systems',exact:true}).click();
   await page.getByRole('button',{name:'Active template',exact:true}).click();
   await page.getByRole('menuitemradio',{name:'Perso',exact:true}).click();
   await page.reload();
   await expect(page.getByRole('navigation',{name:'Private spaces and communities',exact:true}).getByRole('button',{name:'Private space',exact:true})).toBeVisible();
   await page.getByRole('button',{name:'Pinned channels',exact:true}).click();
   await expect(page.getByRole('region',{name:'Pinned channels',exact:true}).getByRole('button',{name:'Space game',exact:true})).toBeVisible();
  }},
  {label:'A saved pin mounts Btr and selects the nested channel', execute:async()=>{
   await page.getByRole('region',{name:'Pinned channels',exact:true}).getByRole('button',{name:'Space game',exact:true}).click();
   await expect(page.getByRole('heading',{name:'Space game',exact:true})).toBeVisible();
   await expect(page.getByRole('button',{name:'Space game',exact:true})).toHaveAttribute('aria-current','page');
  }},
  {label:'The pin list fits a constrained window', execute:async()=>{
   await page.setViewportSize({width:554,height:582});
   await page.getByRole('button',{name:'Pinned channels',exact:true}).click();
  }},
  {label:'Manage pins in a constrained window', execute:async()=>{
   await page.getByRole('button',{name:'Pinned channels',exact:true}).click({button:'right'});
   await expect(page.getByRole('checkbox',{name:'Pin Space game',exact:true})).toBeChecked();
  }},
  {label:'Saved channels can be unpinned', execute:async()=>{
   await page.getByRole('checkbox',{name:'Pin Space game',exact:true}).uncheck();
   await page.getByRole('button',{name:'Done',exact:true}).click();
   await expect(page.getByRole('button',{name:'Pin current channel',exact:true})).toHaveCount(0);
   await expect(page.getByText('No pins yet. Right-click the broccoli button to manage pins.',{exact:true})).toBeVisible();
  }}
 ]);
});




test('buildspaces belong to private channels; User and Feed are application-owned',async({page})=>{
 await page.goto('http://127.0.0.1:43122/?token=local-super-app-review&contributionUrl=http%3A%2F%2F127.0.0.1%3A43130%2F');
 const channels=page.getByRole('navigation',{name:'Channels',exact:true});
 await expect(channels.getByRole('button',{name:'Personal information',exact:true})).toHaveCount(0);
 await channels.getByRole('button',{name:'Buildspaces',exact:true}).click();
 await expect(channels.locator('.channel-children')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Buildspaces',exact:true})).toBeVisible();
 await expect(channels.getByRole('button',{name:'Feed',exact:true})).toHaveCount(0);
 await expect(channels.getByRole('button',{name:'Contribution feed',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Active template',exact:true}).click();await page.getByRole('menuitemradio',{name:'Btr Organisation',exact:true}).click();
 await expect(page.getByRole('button',{name:'Space game',exact:true})).toBeVisible();
});
