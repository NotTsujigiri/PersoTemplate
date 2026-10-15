import { createPersonalVault } from './vault.ts';
import { parsePersonalProfile } from './Depth0/Template/profile-values.ts';

const [storagePath, revision, profileText] = process.argv.slice(2);
if (!storagePath || !revision || !profileText) throw Error('Save worker requires a path, revision and profile.');
const vault = createPersonalVault({storagePath});
const values = parsePersonalProfile(JSON.parse(profileText));
try {
  const result = await vault.save(values, revision);
  console.log(JSON.stringify({saved: true, values: result.values}));
} catch (error) {
  console.log(JSON.stringify({saved: false, message: error instanceof Error ? error.message : String(error)}));
}
