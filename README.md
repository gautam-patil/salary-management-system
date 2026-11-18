# ACME Salary Management

A web app for an HR manager to keep salary data for about 10,000 employees across several countries, and to see how the organisation pays people. It replaces a set of Excel sheets.

**Live demo:** https://salary-management-system-b95v.onrender.com

The demo runs on a free host. After a quiet period the first load can take up to a minute, and the data is re-seeded whenever the server restarts, so edits do not last.

## What it does

**Employees**
- List with pagination, search by name or email, filters for country, department and job title, and sorting on any column.
- Add, edit and delete an employee, with validation (required fields, positive whole-number salary, supported currency, real hire date that is not in the future, unique email).
- Each salary is shown in the employee's own currency.

**Insights**
- Headline numbers: headcount, total payroll, average and median salary.
- Minimum, average, median and maximum pay, and total payroll, for each country, department or job title.
- A table of how many employees fall into each salary band.
- Every insight figure is in USD, converted with a fixed table of illustrative exchange rates.

## Tech

| | |
|---|---|
| Language | TypeScript |
| Backend | Node.js, Express 5, Zod for validation |
| Database | SQLite through Prisma 6, with migrations |
| Frontend | React 19, Vite, Tailwind CSS, shadcn/ui-style components, TanStack Query |
| Tests | Vitest, Supertest, React Testing Library |
| Layout | npm workspaces monorepo |

## Getting started

You need Node 22.12 or newer. The tests, type check and build pass on Node 24 and Node 26, and the Docker image uses Node 24.

```
npm install
cp apps/api/.env.example apps/api/.env
npm run db:deploy -w @acme/api
npm run seed -w @acme/api
```

On the Windows Command Prompt, use `copy apps\api\.env.example apps\api\.env` instead of `cp`. PowerShell and Git Bash accept `cp`.

`npm install` also generates the Prisma client. `db:deploy` creates the database tables, and `seed` fills them with 10,000 employees (about half a second). The seed is deterministic, so every run produces the same data.

Then start the API and the web app, each in its own terminal:

```
npm run dev:api
npm run dev:web
```

Open http://localhost:5173. The web app proxies `/api` to the API on port 3000.

## Tests

```
npm test
npm run typecheck
```

The API tests use a real SQLite file that is built from the migrations before each run and kept separate from the development database. The web tests replace `fetch` with a fake, so they need no server.

## API

| Method and path | What it does |
|---|---|
| `GET /api/employees` | A page of employees. Options: `page`, `pageSize` (up to 100), `search`, `country`, `department`, `jobTitle`, `sortBy`, `sortDir` |
| `GET /api/employees/filters` | The countries, departments and job titles that exist, for the dropdowns |
| `POST /api/employees` | Add an employee |
| `PUT /api/employees/:id` | Replace an employee's details |
| `DELETE /api/employees/:id` | Delete an employee |
| `GET /api/insights/summary` | Headline numbers, in USD |
| `GET /api/insights/groups?by=country` | Pay statistics per country, department or job title (`by=country`, `department` or `jobTitle`), in USD |
| `GET /api/insights/distribution` | Employees per USD salary band |

Errors come back as `{ "error": "...", "details": [...] }`, with 400 for invalid input, 404 for an unknown employee and 409 for a duplicate email.

## Project layout

```
apps/api         Express API, Prisma schema and migrations, seed script
apps/web         React app
packages/shared  Validation schemas, types and reference data used by both
docs/            Requirements and design notes
Dockerfile       One image that serves the API and the built web app
```

## Documents

- [Requirements](docs/requirements.md): the goal, scope, and what was left out and why.
- [Design notes](docs/design.md): architecture diagram, data model, decisions, trade-offs and performance numbers.

## Deployment

The `Dockerfile` builds the web app and runs one Node process that serves both the API and the web page. On start it applies the migrations and seeds the 10,000 employees if the database is empty. It needs no environment variables. The demo is deployed from this repository on Render as a Docker web service.
