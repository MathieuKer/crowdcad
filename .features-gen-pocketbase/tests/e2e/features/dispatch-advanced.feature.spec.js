// Generated from: tests\e2e\features\dispatch-advanced.feature
import { test } from "../../../../tests/e2e/fixtures/index.ts";

test.describe('Dispatch board — advanced (venue with locations and equipment)', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I have a venue with location "Medical Tent" and equipment "Wheelchair 1" and am on the dispatch page', null, { page }); 
  });
  
  test('Equipment section shows configured venue equipment', { tag: ['@authenticated'] }, async ({ When, Then, page }) => { 
    await When('I switch to the "Equipment" section', null, { page }); 
    await Then('I should see the text "Wheelchair 1"', null, { page }); 
  });

  test('Equipment status can be changed on the dispatch board', { tag: ['@authenticated'] }, async ({ When, Then, And, page }) => { 
    await When('I switch to the "Equipment" section', null, { page }); 
    await And('I change equipment "Wheelchair 1" status to "In Use"', null, { page }); 
    await Then('the equipment "Wheelchair 1" should show status "In Use"', null, { page }); 
  });

  test('Posting Schedule modal opens', { tag: ['@authenticated'] }, async ({ When, Then, page }) => { 
    await When('I click the "Posting Schedule" button', null, { page }); 
    await Then('I should see the heading "Schedule"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('tests\\e2e\\features\\dispatch-advanced.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":8,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I have a venue with location \"Medical Tent\" and equipment \"Wheelchair 1\" and am on the dispatch page","isBg":true,"stepMatchArguments":[{"group":{"start":29,"value":"\"Medical Tent\"","children":[{"start":30,"value":"Medical Tent","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":58,"value":"\"Wheelchair 1\"","children":[{"start":59,"value":"Wheelchair 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":9,"keywordType":"Action","textWithKeyword":"When I switch to the \"Equipment\" section","stepMatchArguments":[{"group":{"start":16,"value":"\"Equipment\"","children":[{"start":17,"value":"Equipment","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":10,"keywordType":"Outcome","textWithKeyword":"Then I should see the text \"Wheelchair 1\"","stepMatchArguments":[{"group":{"start":22,"value":"\"Wheelchair 1\"","children":[{"start":23,"value":"Wheelchair 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":15,"pickleLine":12,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I have a venue with location \"Medical Tent\" and equipment \"Wheelchair 1\" and am on the dispatch page","isBg":true,"stepMatchArguments":[{"group":{"start":29,"value":"\"Medical Tent\"","children":[{"start":30,"value":"Medical Tent","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":58,"value":"\"Wheelchair 1\"","children":[{"start":59,"value":"Wheelchair 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":16,"gherkinStepLine":13,"keywordType":"Action","textWithKeyword":"When I switch to the \"Equipment\" section","stepMatchArguments":[{"group":{"start":16,"value":"\"Equipment\"","children":[{"start":17,"value":"Equipment","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":14,"keywordType":"Action","textWithKeyword":"And I change equipment \"Wheelchair 1\" status to \"In Use\"","stepMatchArguments":[{"group":{"start":19,"value":"\"Wheelchair 1\"","children":[{"start":20,"value":"Wheelchair 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":44,"value":"\"In Use\"","children":[{"start":45,"value":"In Use","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":18,"gherkinStepLine":15,"keywordType":"Outcome","textWithKeyword":"Then the equipment \"Wheelchair 1\" should show status \"In Use\"","stepMatchArguments":[{"group":{"start":14,"value":"\"Wheelchair 1\"","children":[{"start":15,"value":"Wheelchair 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":48,"value":"\"In Use\"","children":[{"start":49,"value":"In Use","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":21,"pickleLine":17,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":6,"keywordType":"Context","textWithKeyword":"Given I have a venue with location \"Medical Tent\" and equipment \"Wheelchair 1\" and am on the dispatch page","isBg":true,"stepMatchArguments":[{"group":{"start":29,"value":"\"Medical Tent\"","children":[{"start":30,"value":"Medical Tent","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"},{"group":{"start":58,"value":"\"Wheelchair 1\"","children":[{"start":59,"value":"Wheelchair 1","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":22,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"When I click the \"Posting Schedule\" button","stepMatchArguments":[{"group":{"start":12,"value":"\"Posting Schedule\"","children":[{"start":13,"value":"Posting Schedule","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":23,"gherkinStepLine":19,"keywordType":"Outcome","textWithKeyword":"Then I should see the heading \"Schedule\"","stepMatchArguments":[{"group":{"start":25,"value":"\"Schedule\"","children":[{"start":26,"value":"Schedule","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end