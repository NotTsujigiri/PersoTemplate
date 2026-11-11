import { parseEngineResponse } from "@super-app/relational-engine/Depth15/EngineExchange/parseEngineResponse";
import type { EngineRequest } from "@super-app/relational-engine/Depth8/Contracts/EngineRequest";
import { parsePersonalProfileSnapshot } from './vault.ts';
import { expect,test } from "./file-application.test-support.ts";

function requiredFixture<T>(value:T|null|undefined):T {if(value===null||value===undefined)throw new Error('Fixture expected a value.');return value;}

test("native personal information saves through its owner and rejects a stale open form without losing edits", async ({
  page,
  context,
}) => {
  await page.goto("/?page=user");
  const form = page.getByRole("form", {
    name: "Personal information",
    exact: true,
  });
  await expect(form).toBeVisible();
  if (!(await form.getByLabel("Experience 1", { exact: true }).count()))
    await form
      .getByRole("button", { name: "Add Experience", exact: true })
      .click();
  await form
    .getByLabel("Experience 1", { exact: true })
    .fill("Saved through the native personal channel");
  await form.getByRole("button", { name: "Save", exact: true }).click();
  await expect(form.locator("p[role=status]")).toHaveText("Saved.");
  await page.reload();
  await expect(form.getByLabel("Experience 1", { exact: true })).toHaveValue(
    "Saved through the native personal channel",
  );
  const second = await context.newPage();
  await second.goto("/?page=user");
  const secondForm = second.getByRole("form", {
    name: "Personal information",
    exact: true,
  });
  await secondForm
    .getByLabel("Experience 1", { exact: true })
    .fill("Newer value saved from another open page");
  await secondForm.getByRole("button", { name: "Save", exact: true }).click();
  await expect(secondForm.locator("p[role=status]")).toHaveText("Saved.");
  await form
    .getByLabel("Experience 1", { exact: true })
    .fill("Keep this unsaved correction when stale save is rejected");
  await form.getByRole("button", { name: "Save", exact: true }).click();
  await expect(form.locator("p[role=status]")).toContainText("Could not save");
  await expect(form.getByLabel("Experience 1", { exact: true })).toHaveValue(
    "Keep this unsaved correction when stale save is rejected",
  );
  const request:EngineRequest={kind:'invoke',invocation:{operationId:'personal-vault:read',inputs:{}}};
  const response=parseEngineResponse(await (await page.request.post('/engine',{headers:{Authorization:requiredFixture(process.env['BROCCOLI_FIXTURE_AUTHORIZATION'])},data:request})).json(),request);
  if(response.kind!=='invoke')throw Error('Expected profile operation result.');
  const output=response.result.outputs['result'];if(!output||!('data' in output))throw Error('Expected profile data.');
  const snapshot=parsePersonalProfileSnapshot(output.data);
  expect(snapshot.values.experience[0]).toBe(
    "Newer value saved from another open page",
  );
  await page.getByRole("combobox", {name:"Space",exact:true}).selectOption("private");
  await page.getByRole("combobox",{name:"Children of Buildspaces",exact:true}).selectOption({label:"Personal buildspace"});
  await page
    .getByRole("button", { name: "User", exact: true })
    .click();
  await expect(form.getByLabel("Experience 1", { exact: true })).toHaveValue(
    "Keep this unsaved correction when stale save is rejected",
  );
  await second.close();
});
