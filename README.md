# Personal application

The root package owns this local app assembly. The personal template is the separate workspace package in template/. Btr is an installed dependency from its own repository.

Run npm install --offline, npm run build, then npm start. Open http://127.0.0.1:43121/?token=local-super-app-review. Use npm stop to stop the managed service.

Run npm test for the recorded integration scenarios; it starts an isolated acceptance host on port 43122. Review test-results/ui-review/manifest.json and the screenshots beside tests/assembly.spec.ts. Normal tests do not replace expected recordings.

Dependencies currently use local release archives produced by Broccoli's scripts/pack-local-packages.mjs, plus the independently built Btr package. After updating Btr, build it in its repository and install its new package archive here. No source imports into the Broccoli checkout are used. GitHub hosting has not been configured.

Navigation definitions are authored in template/src/index.ts and the Btr template's source. Perso currently has an empty private space pending the choice of initial channels. Community navigation does not implement network membership or access control.

To refresh local Broccoli packages, run `build.ps1` in its checkout, then:

```powershell
node scripts/pack-local-packages.mjs .runtime/releases/<new-release-name> @super-app/default-super-app-template @super-app/relational-engine-node-js-service @super-app/relational-ui-browser-app
```

Use the resulting `index.json` paths for the direct dependencies already declared in this repository's package manifests. Use a new output directory for each release so npm cannot retain an older archive at the same path. Install with `npm install --offline` and rebuild the personal template. For Btr changes, build and pack Btr in its own repository, update this assembly's `@btr/template` archive dependency, then reinstall. Stop the assembly before reinstalling and restart it afterward.
