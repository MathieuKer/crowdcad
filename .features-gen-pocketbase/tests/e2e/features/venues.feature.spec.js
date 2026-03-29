// Generated from: tests\e2e\features\venues.feature
import { test } from "../../../../tests/e2e/fixtures/index.ts";

test.describe('Venue selection page', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I am on the venue selection page', null, { page }); 
  });
  
  test('Page loads without redirecting to login', { tag: ['@authenticated'] }, async ({ Then, page }) => { 
    await Then('the URL should be "/venues/selection"', null, { page }); 
  });

  test('Page heading is shown', { tag: ['@authenticated'] }, async ({ Then, page }) => { 
    await Then('I should see the "Venue Selection" or "Your Venues" heading', null, { page }); 
  });

  test('New Venue button is rendered', { tag: ['@authenticated'] }, async ({ Then, page }) => { 
    await Then('I should see a "New Venue" button', null, { page }); 
  });

  test('Venue search input is rendered', { tag: ['@authenticated'] }, async ({ Then, page }) => { 
    await Then('I should see the venue search input', null, { page }); 
  });

  test('Clicking New Venue navigates to venue management', { tag: ['@authenticated'] }, async ({ When, Then, page }) => { 
    await When('I click the "New Venue" button', null, { page }); 
    await Then('the URL should be "/venues/management"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('tests\\e2e\\features\\venues.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":9,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given I am on the venue selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"Then the URL should be \"/venues/selection\"","stepMatchArguments":[{"group":{"start":18,"value":"\"/venues/selection\"","children":[{"start":19,"value":"/venues/selection","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":14,"pickleLine":12,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given I am on the venue selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":15,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then I should see the \"Venue Selection\" or \"Your Venues\" heading","stepMatchArguments":[]}]},
  {"pwTestLine":18,"pickleLine":15,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given I am on the venue selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then I should see a \"New Venue\" button","stepMatchArguments":[{"group":{"start":15,"value":"\"New Venue\"","children":[{"start":16,"value":"New Venue","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":22,"pickleLine":18,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given I am on the venue selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then I should see the venue search input","stepMatchArguments":[]}]},
  {"pwTestLine":26,"pickleLine":21,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":7,"keywordType":"Context","textWithKeyword":"Given I am on the venue selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":27,"gherkinStepLine":22,"keywordType":"Action","textWithKeyword":"When I click the \"New Venue\" button","stepMatchArguments":[{"group":{"start":12,"value":"\"New Venue\"","children":[{"start":13,"value":"New Venue","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":28,"gherkinStepLine":23,"keywordType":"Outcome","textWithKeyword":"Then the URL should be \"/venues/management\"","stepMatchArguments":[{"group":{"start":18,"value":"\"/venues/management\"","children":[{"start":19,"value":"/venues/management","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end