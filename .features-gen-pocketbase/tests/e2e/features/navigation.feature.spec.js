// Generated from: tests\e2e\features\navigation.feature
import { test } from "../../../../tests/e2e/fixtures/index.ts";

test.describe('Main navigation', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I am on the venue selection page', null, { page }); 
  });
  
  test('Navbar contains Home and Venues links', { tag: ['@authenticated'] }, async ({ Then, And, page }) => { 
    await Then('I should see a "Home" link', null, { page }); 
    await And('I should see a "Venues" link', null, { page }); 
  });

  test('Home link navigates to the landing page', { tag: ['@authenticated'] }, async ({ When, Then, And, page }) => { 
    await When('I click the "Home" link', null, { page }); 
    await Then('the URL should be "/"', null, { page }); 
    await And('I should see the heading "Welcome back to CrowdCAD"', null, { page }); 
  });

  test('Venues link navigates to venue selection', { tag: ['@authenticated'] }, async ({ Given, When, Then, page }) => { 
    await Given('I navigate to "/"', null, { page }); 
    await When('I click the "Venues" link', null, { page }); 
    await Then('the URL should be "/venues/selection"', null, { page }); 
  });

  test('Profile page loads for authenticated user', { tag: ['@authenticated'] }, async ({ Given, Then, page }) => { 
    await Given('I navigate to "/profile"', null, { page }); 
    await Then('I should see the "Account" tab', null, { page }); 
  });

  test('Authenticated landing page shows Start a New Event', { tag: ['@authenticated'] }, async ({ Given, When, Then, And, page }) => { 
    await Given('I navigate to "/"', null, { page }); 
    await Then('I should see a "Start a New Event" button', null, { page }); 
    await And('I should not see a "Sign In" button', null, { page }); 
    await When('I click the "Start a New Event" button', null, { page }); 
    await Then('the URL should be "/venues/selection"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('tests\\e2e\\features\\navigation.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":8,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I am on the venue selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then I should see a \"Home\" link","stepMatchArguments":[{"group":{"start":15,"value":"\"Home\"","children":[{"start":16,"value":"Home","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"And I should see a \"Venues\" link","stepMatchArguments":[{"group":{"start":15,"value":"\"Venues\"","children":[{"start":16,"value":"Venues","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":15,"pickleLine":12,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I am on the venue selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When I click the \"Home\" link","stepMatchArguments":[{"group":{"start":12,"value":"\"Home\"","children":[{"start":13,"value":"Home","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":14,"keywordType":"Outcome","textWithKeyword":"Then the URL should be \"/\"","stepMatchArguments":[{"group":{"start":18,"value":"\"/\"","children":[{"start":19,"value":"/","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"And I should see the heading \"Welcome back to CrowdCAD\"","stepMatchArguments":[{"group":{"start":25,"value":"\"Welcome back to CrowdCAD\"","children":[{"start":26,"value":"Welcome back to CrowdCAD","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":21,"pickleLine":17,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I am on the venue selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":18,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/\"","stepMatchArguments":[{"group":{"start":14,"value":"\"/\"","children":[{"start":15,"value":"/","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":23,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"When I click the \"Venues\" link","stepMatchArguments":[{"group":{"start":12,"value":"\"Venues\"","children":[{"start":13,"value":"Venues","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":24,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then the URL should be \"/venues/selection\"","stepMatchArguments":[{"group":{"start":18,"value":"\"/venues/selection\"","children":[{"start":19,"value":"/venues/selection","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":27,"pickleLine":22,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I am on the venue selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":23,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/profile\"","stepMatchArguments":[{"group":{"start":14,"value":"\"/profile\"","children":[{"start":15,"value":"/profile","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":29,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then I should see the \"Account\" tab","stepMatchArguments":[{"group":{"start":17,"value":"\"Account\"","children":[{"start":18,"value":"Account","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":32,"pickleLine":26,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I am on the venue selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":33,"gherkinStepLine":27,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/\"","stepMatchArguments":[{"group":{"start":14,"value":"\"/\"","children":[{"start":15,"value":"/","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":34,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"Then I should see a \"Start a New Event\" button","stepMatchArguments":[{"group":{"start":15,"value":"\"Start a New Event\"","children":[{"start":16,"value":"Start a New Event","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":35,"gherkinStepLine":29,"keywordType":"Outcome","textWithKeyword":"And I should not see a \"Sign In\" button","stepMatchArguments":[{"group":{"start":19,"value":"\"Sign In\"","children":[{"start":20,"value":"Sign In","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":36,"gherkinStepLine":30,"keywordType":"Action","textWithKeyword":"When I click the \"Start a New Event\" button","stepMatchArguments":[{"group":{"start":12,"value":"\"Start a New Event\"","children":[{"start":13,"value":"Start a New Event","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":37,"gherkinStepLine":31,"keywordType":"Outcome","textWithKeyword":"Then the URL should be \"/venues/selection\"","stepMatchArguments":[{"group":{"start":18,"value":"\"/venues/selection\"","children":[{"start":19,"value":"/venues/selection","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end