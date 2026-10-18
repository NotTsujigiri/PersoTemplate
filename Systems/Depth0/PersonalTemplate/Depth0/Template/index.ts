import { readContributor } from '@super-app/relational-engine';
import type { SuperAppTemplateFrameElement } from '@super-app/default-super-app-template';
import type { SuperAppTemplateModule, SuperAppTemplateMountContext } from '@super-app/relational-ui-contributor/template-runtime/contract';
import { createCommunities, createUserChannels as userChannels, type PersonalTemplateOptions, type PersonalInformationAdapter } from './channels.js';
import { parsePersonalProfileSnapshot } from './profile-values.js';
export { createCommunities } from './channels.js';
export type { PersonalTemplateOptions, PersonalInformationAdapter, ContributionSurfaceRequest } from './channels.js';

function personalInformation(context: SuperAppTemplateMountContext): PersonalInformationAdapter {
  let revision: string | undefined;
  return {
    async read() {
      const bootstrap = await context.engine.query({kind: 'bootstrap'});
      const owner = bootstrap.graphs.flatMap(graph => graph.nodes).map(readContributor).find(contributor => contributor?.contributorId === 'personal-vault');
      if (!owner) throw Error('Personal information is not connected.');
      await context.engine.query({kind: 'graphs', graphIds: [owner.rootGraphId]});
      const result = await context.engine.invokeOperation({operationId: 'personal-vault:read', inputs: {}});
      const snapshot = parsePersonalProfileSnapshot(result.outputs['result']?.data);
      revision = snapshot.revision;
      return snapshot.values;
    },
    async save(values) {
      if (!revision) throw Error('Read personal information before saving.');
      const result = await context.engine.invokeOperation({operationId: 'personal-vault:save', inputs: {profile: {type: 'application/json', data: values}, expectedRevision: {type: 'application/json', data: revision}}});
      revision = parsePersonalProfileSnapshot(result.outputs['result']?.data).revision;
    },
  };
}
export function createUserChannels(options: PersonalTemplateOptions = {}) {
  return userChannels({personalInformation, ...options});
}
export const communities = createCommunities();
export function createTemplate(options: PersonalTemplateOptions = {}): SuperAppTemplateModule {
  const navigation = createCommunities(options);
  const frames = new WeakMap<SuperAppTemplateMountContext['state'], SuperAppTemplateFrameElement>();
  return {
    id: 'personal',
    mount(context) {
      let frame = frames.get(context.state);
      if (!frame) {
        frame = document.createElement('super-app-template-frame');
        frame.configure(context, {showTools: false, communities: navigation});
        frames.set(context.state, frame);
      }
      context.host.replaceChildren(frame);
      return {unmount: () => frame.remove()};
    },
  };
}
export const template = createTemplate();
