import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseRelationalEngineNodeJsHostConfiguration, startRelationalEngineNodeJsHost } from '@super-app/relational-engine-node-js-service';

const root = resolve('../../..');
const parsed: unknown = JSON.parse(await readFile(resolve(root, 'relational-host.json'), 'utf8'));
const configuration = parseRelationalEngineNodeJsHostConfiguration(parsed);
const config = {...configuration, workingDirectory: root, webHost: {...configuration.webHost, port: 43122}};
await mkdir(resolve(root, '.runtime'), {recursive: true});
const path = resolve(root, '.runtime/acceptance.json');
await writeFile(path, JSON.stringify(config));
const host = await startRelationalEngineNodeJsHost(path);
process.on('SIGTERM', () => {
  void host.stop().then(() => process.exit(0)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
});
