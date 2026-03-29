// Generated from: tests\e2e\features\event-summary.feature
import { test } from "../../../../tests/e2e/fixtures/index.ts";

test.describe('Event summary page', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I have ended an event and am on the summary page', null, { page }); 
  });
  
  test('Summary page renders heading and stat cards', { tag: ['@authenticated'] }, async ({ Then, And, page }) => { 
    await Then('I should see the text "Event Summary:"', null, { page }); 
    await And('I should see the text "Total Calls"', null, { page }); 
    await And('I should see the text "Delivered to Clinic"', null, { page }); 
    await And('I should see the text "Transported"', null, { page }); 
    await And('I should see a "Export Logs" button', null, { page }); 
  });

  test('Staff Logs and Call Logs sections are displayed and can be toggled', { tag: ['@authenticated'] }, async ({ When, Then, And, page }) => { 
    await Then('I should see the text "Staff Logs"', null, { page }); 
    await And('I should see the text "Call Logs"', null, { page }); 
    await When('I click the staff logs show button', null, { page }); 
    await Then('I should see staff log entries', null, { page }); 
    await When('I click the call logs show button', null, { page }); 
    await Then('I should see call log entries', null, { page }); 
  });

  test('Export Logs triggers a CSV download', { tag: ['@authenticated'] }, async ({ Then, page }) => { 
    await Then('clicking "Export Logs" should trigger a CSV download', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('tests\\e2e\\features\\event-summary.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":8,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I have ended an event and am on the summary page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then I should see the text \"Event Summary:\"","stepMatchArguments":[{"group":{"start":22,"value":"\"Event Summary:\"","children":[{"start":23,"value":"Event Summary:","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"And I should see the text \"Total Calls\"","stepMatchArguments":[{"group":{"start":22,"value":"\"Total Calls\"","children":[{"start":23,"value":"Total Calls","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":13,"gherkinStepLine":11,"keywordType":"Outcome","textWithKeyword":"And I should see the text \"Delivered to Clinic\"","stepMatchArguments":[{"group":{"start":22,"value":"\"Delivered to Clinic\"","children":[{"start":23,"value":"Delivered to Clinic","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":14,"gherkinStepLine":12,"keywordType":"Outcome","textWithKeyword":"And I should see the text \"Transported\"","stepMatchArguments":[{"group":{"start":22,"value":"\"Transported\"","children":[{"start":23,"value":"Transported","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":15,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"And I should see a \"Export Logs\" button","stepMatchArguments":[{"group":{"start":15,"value":"\"Export Logs\"","children":[{"start":16,"value":"Export Logs","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":18,"pickleLine":15,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I have ended an event and am on the summary page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":19,"gherkinStepLine":16,"keywordType":"Outcome","textWithKeyword":"Then I should see the text \"Staff Logs\"","stepMatchArguments":[{"group":{"start":22,"value":"\"Staff Logs\"","children":[{"start":23,"value":"Staff Logs","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":20,"gherkinStepLine":17,"keywordType":"Outcome","textWithKeyword":"And I should see the text \"Call Logs\"","stepMatchArguments":[{"group":{"start":22,"value":"\"Call Logs\"","children":[{"start":23,"value":"Call Logs","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":21,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When I click the staff logs show button","stepMatchArguments":[]},{"pwStepLine":22,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then I should see staff log entries","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":20,"keywordType":"Action","textWithKeyword":"When I click the call logs show button","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":21,"keywordType":"Outcome","textWithKeyword":"Then I should see call log entries","stepMatchArguments":[]}]},
  {"pwTestLine":27,"pickleLine":23,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I have ended an event and am on the summary page","isBg":true,"stepMatchArguments":[]},{"pwStepLine":28,"gherkinStepLine":24,"keywordType":"Outcome","textWithKeyword":"Then clicking \"Export Logs\" should trigger a CSV download","stepMatchArguments":[{"group":{"start":9,"value":"\"Export Logs\"","children":[{"start":10,"value":"Export Logs","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end