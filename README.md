# Tiller Rollover Budget

Use this script to adjust your [Tiller](https://www.tillerhq.com/) budget for
current and future months based on a yearly budget for each category and how
much has been spent so far.

### Limitations

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
D2 -> =SUMIFS(Transactions!E:E,Transactions!D:D,A2,Transactions!B:B,">12/31/"&YEAR(TODAY())-1,Transactions!B:B,"<"&$I$1)
      autofill column D
E2 -> =SUM(C2:D2)
      autofill column E
F2 -> =IF(E2>0,E2/$I$2,0)
      autofill column F
```

Alternatively, if you don't care to see all the pieces of the formula broken out
into columns, you can do the following:

```
A1 -> =QUERY(Categories!A:C, "select A, B where C='Expense' order by B, A", 1)
      (column B is not necessary, I just find it useful)
C1 -> "Yearly Budget"
       C:C -> Manually fill in budget for each category for the whole year
D1 -> "Per remaining month"
D2 -> =MAX(0, SUM(C2,SUMIFS(Transactions!E:E,Transactions!D:D,A2,Transactions!B:B,">12/31/"&YEAR(TODAY())-1,Transactions!B:B,"<="&EOMONTH(TODAY(),-1)))/(13-MONTH(TODAY())))
       autofill column D
```

Then you need to either to copy column D into column F, or update the
`getRemainingMonthlyBudget` function in the Apps Script code.

> :warning: **WARNING**: Make a backup copy of your Categories sheet before continuing!!!


Then create the Apps Script file:

1. Open Apps Script from the Extensions menu and copy this script into Code.gs.
2. At the top of the screen near the logo it should say "Untitled Project".
   Edit it to say "Rollover Budget".
3. Adjust the CURRENT_YEAR and CATEGORIES_JANUARY_COLUMN values at the
   beginning of the script as needed.
4. Reload your spreadsheet and select "Rollover Budget" > "Redistribute
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


## Why does this need a script? Can't it be done with just formulas?

Yes, it can be done with just formulas, but with the formula, if you change
your yearly budget values, it will change your budget for past months. If you
need that original budget for historical reasons, then you'll need the script,
because the script will not overwrite previous months' budgets.

If you don't care about keeping historical budget values, here's what you can
do:

> :warning: **WARNING**: Make a backup copy of your Categories sheet before continuing!!!

1. On your Categories sheet add a new column, right before the column for
   January of the current year. Call this column "Yearly Budget".
2. Set your budget values for the entire year for each category in this column.
   If you want a fixed budget for a category, leave this column blank for that
   category (or put a non-numeric value like `-` here instead).
3. Sort your sheet by the Yearly Budget column -- this is temporary, you can
   sort it another way after you've set it up. Make sure the rollover budget
   categories come first -- in other words, make sure row 1 includes a yearly
   budget value.
4. Assuming your Yearly Budget column is `E` and your January of the current
   year column is `F`, paste the forumula below into `F2` (January column in
   the first category row).

Formula:

```
=MAX(
  0,
  SUM(
    $E2,
    SUMIFS(
      Transactions!$E:$E,
      Transactions!$D:$D,
      $A2,
      Transactions!$B:$B,
      ">12/31/"&YEAR(F$1)-1,
      Transactions!$B:$B,
      "<="&MIN(EOMONTH(F$1,-1),EOMONTH(TODAY(), -1))
    )
  )/(
    13-MIN(
      MONTH(TODAY()),
      MONTH(F$1)
    )
  )
)
```

If `E` is not your new Yearly Budget column or `F` is not your January column,
replace `$E2` (one place) and `F$1` (three places) in the above formula to
match your columns.

Then autofill down the January column. Then autofill across to December. Then
you can sort your sheet again however you like.


## TODO

* Implement this solely on the Categories sheet with no need for a new sheet.
  Can use the instructions for columns C and D in the alternate solution above.
  Then update the script. Ensure the script only runs for categories with a
  value in column C (the yearly budget column). This will allow some
  categories to be fixed simply by leaving column C blank on those rows, but
  it will prevent autofilling column D (the formula for the per-month
  remaining value).
