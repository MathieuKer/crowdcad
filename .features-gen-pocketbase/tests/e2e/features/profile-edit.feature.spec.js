// Generated from: tests\e2e\features\profile-edit.feature
import { test } from "../../../../tests/e2e/fixtures/index.ts";

test.describe('Profile edit page', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I navigate to "/profile/edit"', null, { page }); 
  });
  
  test('Edit profile page renders form fields', { tag: ['@authenticated'] }, async ({ Then, And, page }) => { 
    await Then('I should see the heading "Edit Profile"', null, { page }); 
    await And('I should see the "Your full name" placeholder', null, { page }); 
    await And('I should see the "https://..." placeholder', null, { page }); 
  });

  test('Save and Cancel buttons are visible', { tag: ['@authenticated'] }, async ({ Then, And, page }) => { 
    await Then('I should see a "Save Changes" button', null, { page }); 
    await And('I should see a "Cancel" button', null, { page }); 
  });

  test('Cancel navigates back to profile page', { tag: ['@authenticated'] }, async ({ When, Then, page }) => { 
    await When('I click the "Cancel" button', null, { page }); 
    await Then('the URL should be "/profile"', null, { page }); 
  });

  test('Display name can be updated', { tag: ['@authenticated'] }, async ({ When, Then, And, page }) => { 
    await When('I fill the "Your full name" placeholder with "E2E Test User"', null, { page }); 
    await And('I click the "Save Changes" button', null, { page }); 
    await Then('the URL should be "/profile"', null, { page }); 
  });

  test('Phone number field accepts input', { tag: ['@authenticated'] }, async ({ Then, page }) => { 
    await Then('I should see the "+1 555 555 5555" placeholder', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('tests\\e2e\\features\\profile-edit.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":8,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/profile/edit\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/profile/edit\"","children":[{"start":15,"value":"/profile/edit","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then I should see the heading \"Edit Profile\"","stepMatchArguments":[{"group":{"start":25,"value":"\"Edit Profile\"","children":[{"start":26,"value":"Edit Profile","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"And I should see the \"Your full name\" placeholder","stepMatchArguments":[{"group":{"start":17,"value":"\"Your full name\"","children":[{"start":18,"value":"Your full name","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":13,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"And I should see the \"https://...\" placeholder","stepMatchArguments":[{"group":{"start":17,"value":"\"https://...\"","children":[{"start":18,"value":"https://...","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":16,"pickleLine":13,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/profile/edit\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/profile/edit\"","children":[{"start":15,"value":"/profile/edit","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then I should see a \"Save Changes\" button","stepMatchArguments":[{"group":{"start":15,"value":"\"Save Changes\"","children":[{"start":16,"value":"Save Changes","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And I should see a \"Cancel\" button","stepMatchArguments":[{"group":{"start":15,"value":"\"Cancel\"","children":[{"start":16,"value":"Cancel","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":21,"pickleLine":17,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/profile/edit\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/profile/edit\"","children":[{"start":15,"value":"/profile/edit","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":22,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When I click the \"Cancel\" button","stepMatchArguments":[{"group":{"start":12,"value":"\"Cancel\"","children":[{"start":13,"value":"Cancel","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":23,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then the URL should be \"/profile\"","stepMatchArguments":[{"group":{"start":18,"value":"\"/profile\"","children":[{"start":19,"value":"/profile","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":26,"pickleLine":21,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/profile/edit\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/profile/edit\"","children":[{"start":15,"value":"/profile/edit","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":27,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When I fill the \"Your full name\" placeholder with \"E2E Test User\"","stepMatchArguments":[{"group":{"start":11,"value":"\"Your full name\"","children":[{"start":12,"value":"Your full name","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":45,"value":"\"E2E Test User\"","children":[{"start":46,"value":"E2E Test User","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":28,"gherkinStepLine":23,"keywordType":"Action","textWithKeyword":"And I click the \"Save Changes\" button","stepMatchArguments":[{"group":{"start":12,"value":"\"Save Changes\"","children":[{"start":13,"value":"Save Changes","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":29,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then the URL should be \"/profile\"","stepMatchArguments":[{"group":{"start":18,"value":"\"/profile\"","children":[{"start":19,"value":"/profile","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":32,"pickleLine":26,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/profile/edit\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/profile/edit\"","children":[{"start":15,"value":"/profile/edit","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":33,"gherkinStepLine":27,"keywordType":"Outcome","textWithKeyword":"Then I should see the \"+1 555 555 5555\" placeholder","stepMatchArguments":[{"group":{"start":17,"value":"\"+1 555 555 5555\"","children":[{"start":18,"value":"+1 555 555 5555","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end