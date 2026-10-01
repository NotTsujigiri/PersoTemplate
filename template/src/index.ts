import type { FormValues } from '@super-app/relational-ui-contributor/schema-form';
import type { SuperAppTemplateFrameOptions } from '@super-app/default-super-app-template';
import type { SuperAppTemplateModule, SuperAppTemplateMountContext } from '@super-app/relational-ui-contributor/template-runtime/contract';
import { createCommunities, createUserChannels as userChannels, type PersonalTemplateOptions, type PersonalInformationAdapter } from './channels.js';
export { createCommunities } from './channels.js';
export type { PersonalTemplateOptions, PersonalInformationAdapter, ContributionSurfaceRequest } from './channels.js';

type Frame = HTMLElement & { configure(context: SuperAppTemplateMountContext, options: SuperAppTemplateFrameOptions): void };
function personalInformation(context: SuperAppTemplateMountContext): PersonalInformationAdapter {
  let revision: string | undefined;
  return {
    async read() {
      const bootstrap = await context.engine.query({kind: 'bootstrap'});
      const owner = bootstrap.graphs.flatMap(graph => graph.nodes).find(node => 'contributorId' in node && node.contributorId === 'personal-vault');
      if (!owner || !('rootGraphId' in owner)) throw Error('Personal information is not connected.');
      await context.engine.query({kind: 'graphs', graphIds: [owner.rootGraphId as any]});
      const result = await context.engine.invokeOperation({operationId: 'personal-vault:read', inputs: {}});
      const snapshot = result.outputs.result!.data as {values: FormValues; revision: string};
      revision = snapshot.revision;
      return snapshot.values;
    },
    async save(values) {
      if (!revision) throw Error('Read personal information before saving.');
      const result = await context.engine.invokeOperation({operationId: 'personal-vault:save', inputs: {profile: {type: 'application/json', data: values}, expectedRevision: {type: 'application/json', data: revision}}});
      revision = (result.outputs.result!.data as {revision: string}).revision;
    },
  };
}
export function createUserChannels(options: PersonalTemplateOptions = {}) {
  return userChannels({personalInformation, ...options});
}
export const communities = createCommunities();
export function createTemplate(options: PersonalTemplateOptions = {}): SuperAppTemplateModule {
  const navigation = createCommunities(options);
  return {
    id: 'personal',
    mount(context) {
      let frame = context.state.frame as Frame | undefined;
      if (!frame) {
        frame = document.createElement('super-app-template-frame') as Frame;
        frame.configure(context, {showTools: false, communities: navigation});
        context.state.frame = frame;
      }
      context.host.replaceChildren(frame);
      return {unmount: () => frame.remove()};
    },
  };
}
export const template = createTemplate();
