import { SchemaFormElement } from '@super-app/relational-ui-contributor/schema-form';
import { profileFields } from './profile-fields.js';
import { parsePersonalProfile, type PersonalProfile } from './profile-values.js';
import type { ChannelDefinition } from '@super-app/default-super-app-template';
import type {NavigationContext} from '@super-app/default-super-app-template/navigation';

export interface PersonalInformationAdapter {
  read(): Promise<PersonalProfile>;
  save(values: PersonalProfile): Promise<void>;
}
export interface PersonalTemplateOptions<Context=NavigationContext> {
  personalInformation?: PersonalInformationAdapter | ((context: Context) => PersonalInformationAdapter);
}
export function createUserChannels<Context=NavigationContext>(options: PersonalTemplateOptions<Context> = {}): readonly ChannelDefinition<Context>[] {
  return [{
      id: 'personal-information', label: 'Personal information', description: 'Your structured personal information.',
      create(context) {
        const host = document.createElement('section');
        host.style.cssText = 'height:100%;overflow:auto;padding:16px;box-sizing:border-box';
        host.setAttribute('aria-label', 'Personal information');
        host.textContent = 'Loading personal information…';
        void (async () => {
          const adapter = typeof options.personalInformation === 'function' ? options.personalInformation(context) : options.personalInformation;
          if (!adapter) throw Error('Personal information is not connected.');
          const values = await adapter.read();
          host.replaceChildren(SchemaFormElement.create({label: 'Personal information', fields: profileFields, values, save: values => adapter.save(parsePersonalProfile(values))}));
        })().catch((error: unknown) => { host.textContent = String(error); });
        return host;
      },
    }];
}

export {parsePersonalProfileSnapshot,type PersonalProfile} from './profile-values.js';

