/**
 * @OnlyCurrentDoc
 */

// See https://github.com/katylava/tiller-rollover-budget for how to use.

const CURRENT_YEAR = 2022;
const CATEGORIES_JANUARY_COLUMN = 'F';

const JANUARY_INDEX = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(CATEGORIES_JANUARY_COLUMN.toUpperCase());

function onOpen(e) {
  SpreadsheetApp.getUi()
    .createAddonMenu()
    .addItem('Redistribute remaining yearly budget', 'redistributeBudget')
    .addToUi();
}

function redistributeBudget() {
  const sheet = SpreadsheetApp.getActive();
  const categoriesSheet = sheet.getSheetByName('Categories');
  const yearlyBudgetSheet = sheet.getSheetByName('Yearly Categories');

  validateSheets(categoriesSheet, yearlyBudgetSheet);

  const remainingMonthlyBudget = getRemainingMonthlyBudget(yearlyBudgetSheet);
  // Start at row 2 to skip header
  const categories = categoriesSheet.getRange(2, 1, categoriesSheet.getLastRow(), 1).getValues().flat();

  categoriesSheet.activate();
  writeRows(categoriesSheet, categories, remainingMonthlyBudget);

}

function writeRows(sheet, categories, remainingMonthlyBudget) {
  const startMonth = (new Date()).getMonth();
  const startColumn = startMonth + JANUARY_INDEX + 1; // Add 1 because getMonth() is zero-based
  const width = 12 - startMonth; // No offset adjustment needed here because we want to include the current month

  for (let [index, category] of categories.entries()) {
    if (category in remainingMonthlyBudget) {
      // Category at index 0 is row 2 in sheet, because we skipped the header row
      let range = sheet.getRange(index + 2, startColumn, 1, width);
      range.activate(); // just for fun
      let values = new Array(width);
      values.fill(remainingMonthlyBudget[category]);
      console.log(category, range.getA1Notation(), values[0]);
      range.setValues([values]);
    }
  }
}

function getRemainingMonthlyBudget(sheet) {
  const lastRow = sheet.getLastRow();
  const range = sheet.getRange(1, 1, lastRow, 6);
  const values = range.getValues();

  return values.reduce((acc, cur) => {
    if (cur[2] > 0) {
      acc[cur[0]] = cur[5];
    }
    return acc;
  }, {});
}

function validateSheets(categoriesSheet, yearlyBudgetSheet) {
  const yearlyBudgetHeaders = yearlyBudgetSheet.getRange('A1:F1').getValues();

  if (yearlyBudgetHeaders[0][0] !== 'Category' || yearlyBudgetHeaders[0][5] !== 'Per remaining month') {
    throw new Error(
      'The "Yearly Categories" sheet structure has changed. Column A should be "Category". Column F should be "Per remaining month".'
    );
  }

  const categoriesHeaders = categoriesSheet.getRange(`A1:${CATEGORIES_JANUARY_COLUMN}1`).getDisplayValues();

  if (categoriesHeaders[0][0] !== 'Category' || categoriesHeaders[0][JANUARY_INDEX] !== `Jan ${CURRENT_YEAR}`) {
    throw new Error(`
      The "Categories" sheet structure has changed. Column A should be "Category".
      Column ${CATEGORIES_JANUARY_COLUMN} should be "Jan ${CURRENT_YEAR}".
      Or update the value for CATEGORIES_JANUARY_COLUMN in the Rollover Budget Apps Script.
    `);
  }
}
