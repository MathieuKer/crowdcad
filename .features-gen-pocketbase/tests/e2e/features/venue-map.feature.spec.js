// Generated from: tests\e2e\features\venue-map.feature
import { test } from "../../../../tests/e2e/fixtures/index.ts";

test.describe('Venue map management', () => {

  test.beforeEach('Background', async ({ Given, page }, testInfo) => { if (testInfo.error) return;
    await Given('I navigate to "/venues/management"', null, { page }); 
  });
  
  test('Upload a map image to the default layer', { tag: ['@authenticated'] }, async ({ When, Then, page }) => { 
    await When('I upload the venue map image "stage.png"', null, { page }); 
    await Then('the venue map should be displayed', null, { page }); 
  });

  test('Add Markers button appears after map upload', { tag: ['@authenticated'] }, async ({ When, Then, page }) => { 
    await When('I upload the venue map image "stage.png"', null, { page }); 
    await Then('I should see an "Add Markers" button', null, { page }); 
  });

  test('Placing a named marker on the map', { tag: ['@authenticated'] }, async ({ When, Then, And, page }) => { 
    await When('I upload the venue map image "stage.png"', null, { page }); 
    await And('I enable Add Markers mode', null, { page }); 
    await And('I click on the center of the venue map', null, { page }); 
    await And('I name the marker "Gate A"', null, { page }); 
    await Then('I should see the text "Gate A"', null, { page }); 
  });

  test('Adding a new layer via the modal', { tag: ['@authenticated'] }, async ({ When, Then, And, page }) => { 
    await When('I upload the venue map image "stage.png"', null, { page }); 
    await And('I open the add layer modal', null, { page }); 
    await And('I fill the layer name with "Floor 2"', null, { page }); 
    await And('I upload the layer map image "stage.png"', null, { page }); 
    await And('I confirm adding the layer', null, { page }); 
    await Then('I should see the layer named "Floor 2"', null, { page }); 
  });

  test('Editing the default layer name', { tag: ['@authenticated'] }, async ({ When, Then, page }) => { 
    await When('I clear the layer name and type "Main Floor"', null, { page }); 
    await Then('the layer name input should show "Main Floor"', null, { page }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('tests\\e2e\\features\\venue-map.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":7,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/venues/management\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/venues/management\"","children":[{"start":15,"value":"/venues/management","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":11,"gherkinStepLine":8,"keywordType":"Action","textWithKeyword":"When I upload the venue map image \"stage.png\"","stepMatchArguments":[{"group":{"start":29,"value":"\"stage.png\"","children":[{"start":30,"value":"stage.png","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":9,"keywordType":"Outcome","textWithKeyword":"Then the venue map should be displayed","stepMatchArguments":[]}]},
  {"pwTestLine":15,"pickleLine":11,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/venues/management\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/venues/management\"","children":[{"start":15,"value":"/venues/management","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":16,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When I upload the venue map image \"stage.png\"","stepMatchArguments":[{"group":{"start":29,"value":"\"stage.png\"","children":[{"start":30,"value":"stage.png","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then I should see an \"Add Markers\" button","stepMatchArguments":[{"group":{"start":16,"value":"\"Add Markers\"","children":[{"start":17,"value":"Add Markers","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":20,"pickleLine":15,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/venues/management\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/venues/management\"","children":[{"start":15,"value":"/venues/management","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":21,"gherkinStepLine":16,"keywordType":"Action","textWithKeyword":"When I upload the venue map image \"stage.png\"","stepMatchArguments":[{"group":{"start":29,"value":"\"stage.png\"","children":[{"start":30,"value":"stage.png","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":22,"gherkinStepLine":17,"keywordType":"Action","textWithKeyword":"And I enable Add Markers mode","stepMatchArguments":[]},{"pwStepLine":23,"gherkinStepLine":18,"keywordType":"Action","textWithKeyword":"And I click on the center of the venue map","stepMatchArguments":[]},{"pwStepLine":24,"gherkinStepLine":19,"keywordType":"Action","textWithKeyword":"And I name the marker \"Gate A\"","stepMatchArguments":[{"group":{"start":18,"value":"\"Gate A\"","children":[{"start":19,"value":"Gate A","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":25,"gherkinStepLine":20,"keywordType":"Outcome","textWithKeyword":"Then I should see the text \"Gate A\"","stepMatchArguments":[{"group":{"start":22,"value":"\"Gate A\"","children":[{"start":23,"value":"Gate A","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":28,"pickleLine":22,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/venues/management\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/venues/management\"","children":[{"start":15,"value":"/venues/management","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":29,"gherkinStepLine":23,"keywordType":"Action","textWithKeyword":"When I upload the venue map image \"stage.png\"","stepMatchArguments":[{"group":{"start":29,"value":"\"stage.png\"","children":[{"start":30,"value":"stage.png","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":30,"gherkinStepLine":24,"keywordType":"Action","textWithKeyword":"And I open the add layer modal","stepMatchArguments":[]},{"pwStepLine":31,"gherkinStepLine":25,"keywordType":"Action","textWithKeyword":"And I fill the layer name with \"Floor 2\"","stepMatchArguments":[{"group":{"start":27,"value":"\"Floor 2\"","children":[{"start":28,"value":"Floor 2","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":32,"gherkinStepLine":26,"keywordType":"Action","textWithKeyword":"And I upload the layer map image \"stage.png\"","stepMatchArguments":[{"group":{"start":29,"value":"\"stage.png\"","children":[{"start":30,"value":"stage.png","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":33,"gherkinStepLine":27,"keywordType":"Action","textWithKeyword":"And I confirm adding the layer","stepMatchArguments":[]},{"pwStepLine":34,"gherkinStepLine":28,"keywordType":"Outcome","textWithKeyword":"Then I should see the layer named \"Floor 2\"","stepMatchArguments":[{"group":{"start":29,"value":"\"Floor 2\"","children":[{"start":30,"value":"Floor 2","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":37,"pickleLine":30,"tags":["@authenticated"],"steps":[{"pwStepLine":7,"gherkinStepLine":5,"keywordType":"Context","textWithKeyword":"Given I navigate to \"/venues/management\"","isBg":true,"stepMatchArguments":[{"group":{"start":14,"value":"\"/venues/management\"","children":[{"start":15,"value":"/venues/management","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":38,"gherkinStepLine":31,"keywordType":"Action","textWithKeyword":"When I clear the layer name and type \"Main Floor\"","stepMatchArguments":[{"group":{"start":32,"value":"\"Main Floor\"","children":[{"start":33,"value":"Main Floor","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]},{"pwStepLine":39,"gherkinStepLine":32,"keywordType":"Outcome","textWithKeyword":"Then the layer name input should show \"Main Floor\"","stepMatchArguments":[{"group":{"start":33,"value":"\"Main Floor\"","children":[{"start":34,"value":"Main Floor","children":[{"children":[]}]},{"children":[{"children":[]}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end