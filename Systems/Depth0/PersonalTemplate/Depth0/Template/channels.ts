import { SchemaFormElement } from '@super-app/relational-ui-contributor/schema-form';
import { profileFields } from './profile-fields.js';
import { parsePersonalProfile, type PersonalProfile } from './profile-values.js';
import type { ChannelDefinition, ChannelTemplateNavigation } from '@super-app/default-super-app-template';
import type { SuperAppTemplateMountContext } from '@super-app/relational-ui-contributor/template-runtime/contract';

export interface PersonalInformationAdapter {
  read(): Promise<PersonalProfile>;
  save(values: PersonalProfile): Promise<void>;
}
export interface ContributionSurfaceRequest {
  area: 'files' | 'spaces';
  buildspaceId?: string;
}
export type ContributionChannel<Context=SuperAppTemplateMountContext> = Omit<ChannelDefinition<Context>, 'children'> & {
  contribution?: ContributionSurfaceRequest;
  children?: readonly ContributionChannel<Context>[];
};
export type PersonalCommunities<Context=SuperAppTemplateMountContext> = readonly (Omit<ChannelTemplateNavigation<Context>['communities'][number], 'channels'> & {channels: readonly ContributionChannel<Context>[]})[];
export interface PersonalTemplateOptions<Context=SuperAppTemplateMountContext> {
  personalInformation?: PersonalInformationAdapter | ((context: Context) => PersonalInformationAdapter);
  /** Saved buildspaces supplied by their owner, never template-specific examples. */
  buildspaces?: readonly Readonly<{id: string; name: string}>[];
  createContributionSurface?: (request: ContributionSurfaceRequest) => HTMLElement;
}
export function createUserChannels<Context=SuperAppTemplateMountContext>(options: PersonalTemplateOptions<Context> = {}): readonly ChannelDefinition<Context>[] {
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

export function createCommunities<Context=SuperAppTemplateMountContext>(options: PersonalTemplateOptions<Context> = {}): PersonalCommunities<Context> {
  const children: ContributionChannel<Context>[] = (options.buildspaces ?? []).map(space => ({
    id: space.id, label: space.name, description: `Open ${space.name}`,
    contribution: {area: 'files', buildspaceId: space.id},
    create() {
      if (!options.createContributionSurface) throw Error('Buildspace surfaces are not connected.');
      return options.createContributionSurface({area: 'files', buildspaceId: space.id});
    },
  }));
  return [{
    id: 'private', label: 'Private', description: 'Your personal channels', kind: 'private',
    channels: [{
      contribution: {area: 'spaces'},
      id: 'buildspaces', label: 'Buildspaces', description: 'Your saved environments for building across systems.',
      create() {
        if (options.createContributionSurface) return options.createContributionSurface({area: 'spaces'});
        const section = document.createElement('section'); section.className = 'information-panel';
        const heading = document.createElement('h1'); heading.textContent = 'Buildspaces';
        const purpose = document.createElement('p'); purpose.textContent = 'Your saved environments for building across systems.';
        section.append(heading, purpose); return section;
      },
      children,
    }],
  }];
}
export const communities = createCommunities();

export {parsePersonalProfileSnapshot,type PersonalProfile} from './profile-values.js';

