import { test as base, request } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { start, type ApplicationRuntime } from "@super-app/application/runtime/source";
import { authorizeContext } from "@super-app/relational-engine-web-bridge-contributor/session-automation/source";
import { composePersonalConfiguration } from "./configuration.ts";

export * from "@playwright/test";

/** The personal application serving one spec file, with temporary data. */
interface FileApplication {
  readonly origin: string;
  readonly storageState: string;
  close(): Promise<void>;
}

async function startFileApplication(): Promise<FileApplication> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "perso-browser-"));
  const root = path.join(directory, "repository");
  await mkdir(root);
  const git = (...args: string[]) => execFileSync("git", args, { cwd: root });
  git("init");git("config", "user.name", "Browser test");git("config", "user.email", "browser@localhost");
  await writeFile(path.join(root, "README.md"), "Fixture\n");
  git("add", ".");git("commit", "-m", "fixture");
  let app: ApplicationRuntime | undefined;
  const close = async () => {
    await app?.close();
    await rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  };
  try {
    app = await start({
      root,
      store: path.join(directory, "runtime"),
      port: 0,
      adapter: { models: [], create: async () => { throw Error("Agent execution is outside these tests."); } },
      configure: (configuration, context) => ({
        ...composePersonalConfiguration(configuration, { profilePath: path.join(context.storageDirectory, "personal-information.json") }),
        startupTemplateId: "personal",
        frontend: { ...configuration.frontend, sharing: "tab" },
        initialBuildspaces: configuration.initialBuildspaces.map((space) => ({ ...space, name: "Personal buildspace", templateId: "personal" })),
      }),
    });
    const origin = new URL(app.url).origin;
    const client = await request.newContext();
    try {
      await authorizeContext({ request: client }, { origin, token: app.token });
      const storageState = path.join(directory, "browser-auth-fixture.json");
      await client.storageState({ path: storageState });
      // Specs reach the current file's application through this value.
      process.env["BROCCOLI_FIXTURE_AUTHORIZATION"] = "Bearer " + app.token;
      return { origin, storageState, close };
    } finally {
      await client.dispose();
    }
  } catch (error) {
    await close();
    throw error;
  }
}

/** Starts one application per spec file and closes it when the worker moves to another file. */
class FileApplications {
  private current: { readonly file: string; readonly application: Promise<FileApplication> } | undefined;

  async for(file: string): Promise<FileApplication> {
    if (this.current?.file === file) return this.current.application;
    await this.close();
    const application = startFileApplication();
    this.current = { file, application };
    return application;
  }

  async close(): Promise<void> {
    const current = this.current;
    this.current = undefined;
    if (current) await (await current.application).close();
  }
}

/** Tests in one spec file share an application; spec files never do. */
export const test = base.extend<{ application: FileApplication }, { applications: FileApplications }>({
  applications: [async ({}, use) => {
    const applications = new FileApplications();
    await use(applications);
    await applications.close();
  }, { scope: "worker" }],
  application: [async ({ applications }, use, info) => {
    await use(await applications.for(info.file));
  }, { auto: true, timeout: 60_000 }],
  baseURL: async ({ application }, use) => {
    await use(application.origin);
  },
  storageState: async ({ application }, use) => {
    await use(application.storageState);
  },
});
