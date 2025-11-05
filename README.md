
# Smart Parking Admin 

This repository contains the admin dashboard for Smart Parking — a React + Vite single-page app used to manage parking reservations, users, payments, slot inventory and system alerts. It uses Firebase for backend services (Firestore auth & storage).

---

## Live Deployment

* **User Side:** [https://userpark.vercel.app/](https://userpark.vercel.app/)
* **Admin Dashboard:** [https://userpark.vercel.app/admin](https://userpark.vercel.app/admin)

---

## Features

* **User Portal**

  * Check parking slot availability.
  * Add money to wallet.
  * View parking history.

* **Admin Dashboard**

  * Monitor parking slots in real-time.
  * View transactions and user wallet balances.
  * Manage users and parking sessions.

---
## Quick summary

- Framework: React (functional components, hooks)

- Styling: plain CSS files (per-component and global)
- Backend: Firebase (Firestore, Auth, Storage)

- Icons: lucide-react + react-icons

## Table of contents

- [Requirements](#requirements)
- [Install & run](#install--run)
- [Available scripts](#available-scripts)
- [Firebase configuration](#firebase-configuration)
- [Project structure](#project-structure)
- [Key components & pages](#key-components--pages)
- [Firestore collections used](#firestore-collections-used)
- [Extending the app](#extending-the-app)
- [Troubleshooting & notes](#troubleshooting--notes)
- [Contributing](#contributing)
- [License](#license)

## Requirements

- Node.js (14+ recommended; v18+ preferred)
- npm (or yarn)
- A Firebase project (Firestore + Auth + Storage) if you want to run the app against a real backend

## Install & run

Open a terminal (PowerShell on Windows) in the repository root and run:

```powershell
# install dependencies
npm install

# start dev server with HMR
npm run dev
```

The dev server uses Vite and will host the app on http://localhost:5173 by default.

To create a production build:

```powershell
npm run build

# preview the build locally
npm run preview
```

## Available scripts

Scripts are defined in `package.json`:

- `npm run dev` — start the Vite dev server
- `npm run build` — create an optimized production build
- `npm run preview` — locally preview production build
- `npm run lint` — run ESLint over the project

You can see the exact scripts and versions in `package.json`.

## Firebase configuration

This project initializes Firebase in `src/firebaseConfig.js`. The file currently includes a Firebase configuration object and initializes app, auth, firestore and storage:

- `src/firebaseConfig.js` exports:
	- `auth` (Firebase Auth)
	- `db` (Firestore instance)
	- `storage` (Firebase Storage)

Important note: the repo currently contains a firebase configuration object in `src/firebaseConfig.js`. For safety in a production or public repo, replace the inline credentials with environment variables and keep secrets out of source control.

Recommended approach:

1. Create a `.env` file in the project root (add it to `.gitignore`).
2. Add variables such as `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.
3. Update `src/firebaseConfig.js` to read from `import.meta.env.VITE_FIREBASE_API_KEY` and so on.

Example .env (do not commit):

```text
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Project structure (high level)

Key files and folders:

- `index.html` — Vite entry
- `src/main.jsx` — React entrypoint (renders `<App />`)
- `src/App.jsx` — top-level App (currently renders `Dashboard`)
- `src/firebaseConfig.js` — Firebase initialization
- `src/pages/` — top-level pages (Dashboard)
- `src/components/` — reusable UI components
- `src/assets/` — static assets
- `vite.config.js` — Vite configuration

Example components present in `src/components/`:

- `Header.jsx` — top header UI
- `Sidebar.jsx` — the admin sidebar and navigation
- `ReservationTable.jsx`, `SlotTable.jsx`, `UserTable.jsx`, `PaymentTable.jsx` — data tables
- `SummaryCards.jsx`, `AnalyticsChart.jsx` — overview widgets
- `SlotCard.jsx` — single slot display
- `AlertsPanel.jsx` — alerts UI
- `PriceSettings.jsx` — price configuration UI

The main page is `src/pages/Dashboard.jsx` which contains logic to fetch documents from Firestore and render the tabs (overview, slots, alerts, payments, users).

## Key components & responsibilities

- Dashboard (src/pages/Dashboard.jsx)
	- fetches Firestore collections: `reservations`, `users`, `transactions`, `alerts`
	- computes totals (total revenue, completed reservations)
	- switches between tabs: Overview, Slots, Alerts, Payments, Users

- Tables (ReservationTable, SlotTable, UserTable, PaymentTable)
	- display lists of records. These are good places to add pagination, sorting and CSV export (react-csv is already installed).

- AnalyticsChart
	- uses `recharts` for charts and visual summaries.

## Firestore collections used

The dashboard reads the following collections (from `Dashboard.jsx`):

- `reservations` — parking bookings / slot reservations
- `users` — user records
- `transactions` — payments & receipts
- `alerts` — system alerts

Each fetched document is mapped into a plain object and used by the UI. Dates are commonly stored as Firestore Timestamps and in some places the code checks for `toDate()`.

When writing data to Firestore, ensure the schema remains consistent (for example: `reservation_fee` numeric, `created_at` as a timestamp) so the dashboard calculations work reliably.

## Security and rules

- This repository is a frontend admin dashboard. In production, never rely on client-side protection for admin operations — secure Firestore with server-side rules and identity checks (Firebase Auth + Firestore security rules, and ideally role-based claims).

## Extending the app

Suggestions for common changes:

- Add proper authentication flows (login, role check) using `auth` (Firebase Auth). Protect the admin area.
- Add pagination or server-side querying for large collections (use Firestore query cursors).
- Move configuration to environment variables and remove hard-coded firebaseConfig from source.
- Add unit/integration tests for components (React Testing Library + Vitest/Jest).

## Troubleshooting & notes

- If you get Firebase permission errors, check Firestore rules and authentication state.
- If date values look wrong, confirm whether the stored value is a string, timestamp, or unix number, and adjust rendering accordingly.

## Contributing

1. Fork the repo and create a branch for your change.
2. Add small, well-scoped commits and provide a clear description.
3. Open a pull request and include screenshots or reproduction steps for UI changes.

## License

This README does not include a license file. Add a `LICENSE` file to the repo to declare the project's license.

## Where to go next

- Move Firebase credentials into environment variables.
- Add a minimal authentication page and gate `Dashboard` behind login.
- Add tests for `Dashboard` and the primary tables.

If you'd like, I can:

1. Replace the inline Firebase config in `src/firebaseConfig.js` with environment variables and update example `.env` (safe default), and add `.env` instructions to `.gitignore`.
2. Add a basic login page that uses Firebase Auth and protects the dashboard.

Tell me which follow-up you want and I will implement it.

