// Use this script to adjust your budget for current and future months based on a yearly budget
// for each category and how much has been spent so far.

// Limitations:
// * The script depends on the Tiller foundation template, particularly the Transactions
//   and Categories sheets.
// * January can't be in a column beyond Z in your Categories sheet.
// * The script has not been tested with multiple years in the Categories sheet.
// * Your Transactions sheet has to have the date in column B, the category in column D, and the
//   amount in column E.
// * This will only rollover categories where the type is "Expense". You can try removing that
//   condition from the query in A1 to see if it still works for you. I haven't tried it.

// To get started create a new sheet called "Yearly Categories" with the following formulas and values:
// A1 -> =QUERY(Categories!A:C, "select A, B where C='Expense' order by B, A", 1)
//       (column B is not necessary, I just find it useful)
// C1 -> "Yearly Budget"
//        C:C -> Manually fill in budget for each category for the whole year
// D through F headings -> Spent, Remaining, Per remaining month
// H1 -> "First day of current month"
// I1 -> =EOMONTH(TODAY(),-1)+1
// H2 -> "Remaining months in year: (including this month)"
// I2 -> =13-month(I1)
// D2 -> =SUMIFS(Transactions!E:E,Transactions!D:D,A2,Transactions!B:B,">12/31/2021",Transactions!B:B,"<"&$I$1)
//       (adjust date in formula to be the last day of the previous year)
//       autofill column D
// E2 -> =SUM(C2:D2)
//       autofill column E
// F2 -> =IF(E2>0,E2/$I$2,0)
//       autofill column F

// **IMPORTANT**: Make a backup copy of your Categories sheet before continuing!!!

// After you have created the "Yearly Categories" sheet and filled in your yearly budgets,
// open Apps Script from the Extensions menu and copy this script into Code.gs. Adjust the
// CURRENT_YEAR and CATEGORIES_JANUARY_COLUMN below as needed. Reload your spreadsheet and select
// "Rollover Budget" > "Redistribute remaining yearly budget" from the Extensions menu. On the
// first run you will be prompted to allow the script to access your sheet. Approve the permission
// request and you should be good to go.

// Tips:
// * Run at the beginning of each month AFTER your spreadsheet has all the transactions from
//   the previous month. I usually wait until the 5th, or until I see transactions from the
//   very last day of the previous month.
// * You can adjust the budget values on the "Yearly Categories" sheet and re-run the script
//   at any time.
// * Install the "Yearly Budget" sheet from the Tiller Community Solutions extension and check
//   your "Budgeted Cashflow" for each month to make sure it's what you want. Do this whenever
//   you change your budgeted values.


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
    acc[cur[0]] = cur[5];
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
