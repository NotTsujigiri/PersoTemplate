# Personal template

`Systems/Depth0/PersonalTemplate` owns the `@perso/template` package. Its TypeScript configuration composes Btr and Default, registers the personal-data contributor, and exposes the Personal information view independently through `createUserChannels`.

The Broccoli application composition root imports `@perso/template/configuration`. Run `start.ps1` or `npm start` in The Broccoli to use the composed application. User runtime data belongs in the configured private-space repository, outside this source checkout.

Run `npm install --offline`, `npm run build`, and `npm test` here. Package dependencies use explicit local package declarations. The shared ProjectTools checks enforce strict TypeScript and package boundaries. The Broccoli harness owns the composed browser recordings for template navigation, context-scoped tools, personal data, shared engines, and startup/recovery.

Views return ordinary channel definitions and DOM factories; consumers can place individual views in their own navigation without adopting a complete template layout. Contributor composition remains additive and rejects conflicting identities.
