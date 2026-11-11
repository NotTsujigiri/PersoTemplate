import { expect,test } from './file-application.test-support.ts';
import { writeFile } from 'node:fs/promises';

test('personal list panels use compact accessible icons and the Broccoli icon is centered',async({page},info)=>{
  await page.setViewportSize({width:865,height:639});
  await page.goto('/?page=user');
  const form=page.getByRole('form',{name:'Personal information',exact:true});
  await expect(form).toBeVisible();
  await form.getByRole('button',{name:'Add Experience',exact:true}).click();
  const record=await page.evaluate(()=>{
function fixtureStyle(value:unknown):CSSStyleDeclaration {if(!(value instanceof Element))throw Error("Fixture expected a styled element");return getComputedStyle(value);}

function fixtureInstance<T>(value: unknown, constructor: abstract new (...arguments_: never[]) => T): T { if (!(value instanceof constructor)) throw new Error(`Fixture expected ${constructor.name}.`); return value; }

function requiredFixture<T>(value:T|null|undefined):T {if(value===null||value===undefined)throw new Error("Fixture expected a browser value.");return value;}

    const form=document.querySelector('form[aria-label="Personal information"]');
    const add=requiredFixture(form).querySelector('[aria-label="Add Experience"]'),remove=requiredFixture(form).querySelector('[aria-label="Remove Experience 1"]');
    const group=requiredFixture(add).closest('fieldset');
    const pin=document.querySelector('.navigation-bush-trigger'),svg=requiredFixture(pin).querySelector('svg'),a=requiredFixture(pin).getBoundingClientRect(),b=requiredFixture(svg).getBoundingClientRect();
    return {add:requiredFixture(add).textContent,remove:requiredFixture(remove).textContent,addTitle:fixtureInstance(requiredFixture(add), HTMLElement).title,removeTitle:fixtureInstance(requiredFixture(remove), HTMLElement).title,listPanel:parseFloat(fixtureStyle(requiredFixture(group)).borderTopWidth)>0,broccoliCentered:Math.abs(a.x+a.width/2-b.x-b.width/2)<=1&&Math.abs(a.y+a.height/2-b.y-b.height/2)<=1};
  });
  await writeFile(info.outputPath('profile-controls-record.json'),JSON.stringify(record,null,2));
  await page.screenshot({path:info.outputPath('profile-controls.png')});
  expect(record).toEqual({add:'+',remove:'×',addTitle:'Add Experience',removeTitle:'Remove Experience 1',listPanel:true,broccoliCentered:true});
  await form.getByRole('button',{name:'Add Experience',exact:true}).click();
  await form.getByRole('textbox',{name:'Experience 2',exact:true}).fill('Retain this value');
  await form.getByRole('button',{name:'Remove Experience 1',exact:true}).click();
  await expect(form.getByRole('textbox',{name:'Experience 1',exact:true})).toHaveValue('Retain this value');
  await expect(form.getByRole('button',{name:'Remove Experience 1',exact:true})).toHaveAttribute('title','Remove Experience 1');
  await page.setViewportSize({width:554,height:582});
  await page.screenshot({path:info.outputPath('profile-controls-narrow.png')});
});
