// Generated from: tests\e2e\features\landing.feature
import { test } from "../../../../tests/e2e/fixtures/index.ts";

test.describe('Landing page', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I am on the landing page', null, { page }); 
  });
  
  test('Correct document title', { tag: ['@public'] }, async ({ Then, page }) => { 
    await Then('the page title should be "CrowdCAD"', null, { page }); 
  });

  test('Main heading is displayed', { tag: ['@public'] }, async ({ Then, page }) => { 
    await Then('I should see the heading "Welcome back to CrowdCAD"', null, { page }); 
  });

  test('Sign In button is shown when logged out', { tag: ['@public'] }, async ({ Then, page }) => { 
    await Then('I should see a "Sign In" button', null, { page }); 
  });

  test('Login modal opens when Sign In is clicked', { tag: ['@public'] }, async ({ When, Then, page }) => { 
    await When('I click the "Sign In" button', null, { page }); 
    await Then('the login modal should be visible', null, { page }); 
  });

  test('Footer link is shown', { tag: ['@public'] }, async ({ Then, page }) => { 
    await Then('I should see a link "crowdcad.org"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('tests\\e2e\\features\\landing.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":8,"tags":["@public"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I am on the landing page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then the page title should be \"CrowdCAD\"","stepMatchArguments":[{"group":{"start":25,"value":"\"CrowdCAD\"","children":[{"start":26,"value":"CrowdCAD","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":14,"pickleLine":11,"tags":["@public"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I am on the landing page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"Then I should see the heading \"Welcome back to CrowdCAD\"","stepMatchArguments":[{"group":{"start":25,"value":"\"Welcome back to CrowdCAD\"","children":[{"start":26,"value":"Welcome back to CrowdCAD","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":18,"pickleLine":14,"tags":["@public"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I am on the landing page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then I should see a \"Sign In\" button","stepMatchArguments":[{"group":{"start":15,"value":"\"Sign In\"","children":[{"start":16,"value":"Sign In","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":22,"pickleLine":17,"tags":["@public"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I am on the landing page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When I click the \"Sign In\" button","stepMatchArguments":[{"group":{"start":12,"value":"\"Sign In\"","children":[{"start":13,"value":"Sign In","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":24,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then the login modal should be visible","stepMatchArguments":[]}]},
  {"pwTestLine":27,"pickleLine":21,"tags":["@public"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I am on the landing page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":22,"keywordType":"Outcome","textWithKeyword":"Then I should see a link \"crowdcad.org\"","stepMatchArguments":[{"group":{"start":20,"value":"\"crowdcad.org\"","children":[{"start":21,"value":"crowdcad.org","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end