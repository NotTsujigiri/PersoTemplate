// Browser specs import the application's served component URLs; this maps them to their sources for type checking.
import {browserSources} from '@super-app/application/browser-sources/source';
import {mkdir,writeFile} from 'node:fs/promises';
import {browserTypePaths} from '@super-app/default-super-app-template/browser-bundle/source';
const directory=new URL("../../../.runtime/",import.meta.url);
await mkdir(directory,{recursive:true});
await writeFile(new URL('browser-types.json',directory),JSON.stringify({compilerOptions:{paths:await browserTypePaths(browserSources)}},null,2)+'\n');
