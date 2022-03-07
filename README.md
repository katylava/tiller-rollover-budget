# Tiller Rollover Budget

Use this script to adjust your [Tiller](https://www.tillerhq.com/) budget for
current and future months based on a yearly budget for each category and how
much has been spent so far.

Limitations:

* The script depends on the Tiller foundation template, particularly the
  Transactions and Categories sheets.
* January can't be in a column beyond Z in your Categories sheet.
* The script has not been tested with multiple years in the Categories sheet.
* Your Transactions sheet has to have the date in column B, the category in
  column D, and the amount in column E. If this isn't the case you'll need to
  adjust the formula for D2 below.
* This will only rollover categories where the type is "Expense". You can try
  removing that condition from the query in A1 to see if it still works for
  you. I haven't tried it.

## Set up

To get started create a new sheet called "Yearly Categories" with the following
formulas and values:

```
A1 -> =QUERY(Categories!A:C, "select A, B where C='Expense' order by B, A", 1)
      (column B is not necessary, I just find it useful)
C1 -> "Yearly Budget"
       C:C -> Manually fill in budget for each category for the whole year
D through F headings -> Spent, Remaining, Per remaining month
H1 -> "First day of current month"
I1 -> =EOMONTH(TODAY(),-1)+1
H2 -> "Remaining months in year: (including this month)"
I2 -> =13-month(I1)
D2 -> =SUMIFS(Transactions!E:E,Transactions!D:D,A2,Transactions!B:B,">12/31/2021",Transactions!B:B,"<"&$I$1)
      (adjust date in formula to be the last day of the previous year)
      autofill column D
E2 -> =SUM(C2:D2)
      autofill column E
F2 -> =IF(E2>0,E2/$I$2,0)
      autofill column F
```

> :warning: **WARNING**: Make a backup copy of your Categories sheet before continuing!!!


Then create the Apps Script file:

1. Open Apps Script from the Extensions menu and copy this script into Code.gs.
2. Adjust the CURRENT_YEAR and CATEGORIES_JANUARY_COLUMN below as needed.
3. Reload your spreadsheet and select "Rollover Budget" > "Redistribute
   remaining yearly budget" from the Extensions menu.

On the first run you will be prompted to allow the script to access your sheet.
Approve the permission request and you should be good to go.

## Tips

* Run at the beginning of each month AFTER your spreadsheet has all the
  transactions from the previous month. I usually wait until the 5th, or until
  I see transactions from the very last day of the previous month.
* You can adjust the budget values on the "Yearly Categories" sheet and re-run
  the script at any time.
* Install the "Yearly Budget" sheet from the Tiller Community Solutions
  extension and check your "Budgeted Cashflow" for each month to make sure it's
  what you want. Do this whenever you change your budgeted values.

