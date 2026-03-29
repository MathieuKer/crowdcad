// Generated from: tests\e2e\features\venue-deletion.feature
import { test } from "../../../../tests/e2e/fixtures/index.ts";

test.describe('Venue and event deletion', () => {

  test.beforeEach('Background', async ({ Given, page, scenarioState }, testInfo) => { if (testInfo.error) return;
    await Given('I have a venue on the selection page', null, { page, scenarioState }); 
  });
  
  test('Delete option appears in venue actions menu', { tag: ['@authenticated'] }, async ({ When, Then, page, scenarioState }) => { 
    await When('I open the venue actions menu', null, { page, scenarioState }); 
    await Then('I should see the text "Delete"', null, { page }); 
  });

  test('Deleting a venue removes it from the list', { tag: ['@authenticated'] }, async ({ When, Then, And, page, scenarioState }) => { 
    await When('I open the venue actions menu', null, { page, scenarioState }); 
    await And('I confirm venue deletion', null, { page, scenarioState }); 
    await Then('the venue should no longer be visible', null, { page, scenarioState }); 
  });

  test('Venue deletion can be cancelled via the dialog', { tag: ['@authenticated'] }, async ({ When, Then, And, page, scenarioState }) => { 
    await When('I open the venue actions menu', null, { page, scenarioState }); 
    await And('I cancel venue deletion', null, { page, scenarioState }); 
    await Then('the venue should still be visible', null, { page, scenarioState }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('tests\\e2e\\features\\venue-deletion.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":8,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I have a venue on the selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":9,"keywordType":"Action","textWithKeyword":"When I open the venue actions menu","stepMatchArguments":[]},{"pwStepLine":12,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"Then I should see the text \"Delete\"","stepMatchArguments":[{"group":{"start":22,"value":"\"Delete\"","children":[{"start":23,"value":"Delete","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":15,"pickleLine":12,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I have a venue on the selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When I open the venue actions menu","stepMatchArguments":[]},{"pwStepLine":17,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"And I confirm venue deletion","stepMatchArguments":[]},{"pwStepLine":18,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then the venue should no longer be visible","stepMatchArguments":[]}]},
  {"pwTestLine":21,"pickleLine":17,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I have a venue on the selection page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When I open the venue actions menu","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"And I cancel venue deletion","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then the venue should still be visible","stepMatchArguments":[]}]},
]; // bdd-data-end