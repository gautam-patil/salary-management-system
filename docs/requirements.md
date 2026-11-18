# Requirements: ACME Salary Management

**Persona:** HR Manager at ACME (single user)
**Scale:** ~10,000 employees across multiple countries

## 1. Goal

Replace the Excel sheets HR uses today with a web app that lets the HR Manager
(a) keep employee salary data accurate and (b) answer "how do we pay people?"
without building pivot tables by hand.

Success looks like:
- Find or edit any employee in seconds, even with 10,000 rows.
- Answer common pay questions (by country, department, job title) in one screen.

## 2. Scope and features

**A. Employee management**
- List employees with server-side pagination, sorting and search (name, email).
- Filter by country, department and job title.
- Create, edit and delete an employee.
- Fields: full name, email, job title, department, country, salary (annual, in the
  local currency), currency (ISO 4217), hire date.
- Validation on every write (required fields, supported country, positive salary,
  valid currency, unique email).

**B. Pay insights (the "answer questions" part)**
- Headline numbers: headcount, total payroll, average and median salary.
- Salary statistics (min / avg / median / max, headcount) grouped by country,
  department or job title.
- Salary distribution: how many employees fall in each salary band, as a table.
- All insight figures are in USD, converted with a static, documented exchange-rate
  table. The employee list shows each salary in its own currency.

**C. Data and operations**
- Seed script that generates 10,000 realistic employees, deterministic via a fixed seed.
- Deployed app plus a short video demo.

## 3. Deliberately left out (and why)

| Left out | Reason |
|---|---|
| Authentication / roles | One persona. Adds ceremony without showing the core skill. Would be first on the roadmap. |
| Managing countries and currencies from the UI | A fixed list is enough for one org. Would move to database tables next. |
| Live FX rates | Needs an external API and non-deterministic tests. A static table is explainable and testable. |
| Salary history / audit trail | Valuable but a separate feature. Keeps the data model simple. |
| Bulk import/export (CSV) | Tempting for ex-Excel users, but the seed covers the initial load. Good next step. |
| Payroll, tax, bonuses, benefits | Different problem; "salary" here means base annual pay. |
| Pay-equity (gender) analysis | Needs sensitive data and careful handling. Out of scope for this iteration. |
| Multi-tenancy, i18n, mobile app | Not needed for one org and one HR persona. |

## 4. Key assumptions

- One salary per employee: current annual base pay.
- Salary is stored in the employee's own currency (one of 9 supported). The country
  only suggests a default.
- Countries, currencies and exchange rates come from a fixed list (10 countries, 9
  currencies) kept in code. The API rejects any other country. HR cannot add a new
  one from the UI; that needs a code change and a deploy.
- Insights are computed on demand. Fine at 10k rows; revisit if data grows 100x.
- Median is computed accurately, not approximated.

## 5. Quality bar

- Core logic (stats, FX conversion, validation) is unit tested, fast and deterministic.
- API covered by HTTP-level tests; list endpoint stays fast with 10k rows (indexed filters).
- Incremental commits, with the requirements and design notes in `docs/`.
