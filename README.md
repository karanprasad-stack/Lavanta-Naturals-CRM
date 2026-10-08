# Lavanta Naturals — Internal Management Platform

[![Production Build](https://img.shields.io/badge/Production%20Build-Passing%20(Code%200)-success)](#production-build)
[![Verification Suites](https://img.shields.io/badge/Automated%20Verification-164%2F164%20Tests%20Passed-69C43F)](#automated-verification)
[![Security & RBAC](https://img.shields.io/badge/Security-Strict%20RBAC%20%2B%20Audit%20Trail-blue)](#security--rbac)

Lavanta Naturals is an enterprise-grade internal operations and management platform built specifically for herbal wellness and natural FMCG operations. The platform unifies high-level leadership cockpit visibility with real-time operational workflows across tasks, team members, omni-channel sales orders, inventory movements, operating expenses, corporate knowledge documents, company OKRs, communications, and security audit logs.

---

## 🏛️ System Architecture

- **Frontend**: React 18 with TypeScript, Vite, React Router 6, Framer Motion, Recharts, Lucide Icons.
- **Design System**: Luxury Herbal theme (`#FAFBF8` background, `#284B3A` deep forest green, `#69C43F` herbal accent, glassmorphism, responsive navigation).
- **Backend API**: Node.js & Express with TypeScript, strict REST routing, in-memory sliding-window rate limiters, security headers (`helmet`-style protections), and structured JSON responses.
- **Database Layer**: MongoDB with Mongoose ODM, compound indexing, transactional stock updates, and sanitized security audit persistence.
- **Real-Time Communication**: In-app WebSockets/polling notification center, live chat channels, and unread counts.

---

## 👥 5-Role RBAC Matrix

| Role | Scope & Permissions | Key Accessible Areas |
| :--- | :--- | :--- |
| **FOUNDER** | Complete executive platform control, system governance, and financials | Founder Dashboard (`/dashboard`), Security Audit (`/audit`), System Status (`/system`), Financials, Full Exports, All Modules |
| **HR** | People operations, employee lifecycle, directory, and security oversight | Team Management (`/team`), Security Audit (`/audit`), Announcements, Documents, Tasks, Profile |
| **MANAGER** | Department leadership, task dispatching, expense approvals, sales orders | Team Tasks (`/tasks`), Sales & Orders (`/orders`), Expense Approvals (`/expenses`), Goals (`/goals`), Work Activity |
| **EMPLOYEE** | Personal productivity, assigned task execution, reimbursement claims | My Tasks, My Activity (`/my-activity`), My Goals (`/my-goals`), Expense Claims, Company Chat, Documents |
| **INTERN** | Scoped learning, task execution, internal communication | Assigned Tasks, Company Chat, Public Knowledge Documents, Announcements |

---

## 📦 Functional Modules (Phases 1 — 13)

1. **Phase 1 — Core Platform & Identity**: Multi-role JWT authentication, persistent sessions, light luxury herbal UI layout.
2. **Phase 2 — Team & Directory**: User lifecycle, departments, contact directories, and role management.
3. **Phase 3 — Real-Time Notifications**: Unread badges, popover center, categorized alerts, and mark-as-read workflows.
4. **Phase 4 — Task Management**: Prioritized tasks, assignment, attachments, comments, and status transitions.
5. **Phase 5 — Company Announcements**: Company-wide broadcasts, priority tags, and readership acknowledgement.
6. **Phase 6 — Real-Time Chat**: Team channels, direct messaging, unread counts, and real-time messaging.
7. **Phase 7 — Collaborative Calendar**: Meetings, schedules, company milestones, and virtual deadline sync.
8. **Phase 8 — Work Activity Monitoring**: Ethical task timeline tracking, progress status logs (no surveillance/idle tracking).
9. **Phase 9 — Goals, OKRs & Performance**: Company & Department OKRs, key result mathematical rollups, and at-risk variance detection.
10. **Phase 10 — Documents & Knowledge Management**: Multi-level folder hierarchies (max depth 4), version history (v1, v2...), and departmental visibility.
11. **Phase 11 — Products & Inventory**: Full Ayurvedic product catalog, SKU tracking, stock adjustments, stock in/out ledger, and low-stock alerts.
12. **Phase 12 — Sales, Orders & Expenses**: Customer CRM, order confirmation with atomic stock deduction, expense approval workflows, and revenue analytics.
13. **Phase 13 — Founder Command Center & Production Readiness**:
    - **Unified Founder Dashboard (`/dashboard`)**: Single executive source of truth with 6 vital KPIs, priority attention triage, 7-day revenue momentum, work status distribution, and unified audit stream.
    - **Unified Activity Service**: Normalized real-time aggregation across 6 activity collections.
    - **Security Audit Trail (`/audit`)**: Tamper-evident logging of sensitive actions (`LOGIN`, `ROLE_CHANGED`, `STOCK_ADJUSTED`, `EXPENSE_APPROVED`, `EXPORT_GENERATED`).
    - **Global Multi-Entity Search (`⌘K`)**: Debounced server-side search across People, Tasks, Announcements, Documents, Goals, Products, and Orders.
    - **Quick Create (`+`)**: Universal action modal respecting user role permissions.
    - **Data Export Engine**: Sanitized CSV exports with mandatory audit logging.
    - **Hardened Security**: Sliding-window rate limiting, HTTP security headers, and credential sanitization.

---

## 📁 Repository Structure

```
.
├── Frontend/                 # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/                  # App components, pages, context, and services
│   ├── public/               # Static assets & brand icons
│   ├── package.json          # Frontend dependencies
│   └── vite.config.ts        # Vite configuration with API & WebSocket proxies
│
├── Backend/                  # Node.js + Express + TypeScript + Mongoose API
│   ├── src/                  # Controllers, models, middleware, routes, and services
│   ├── src/scripts/          # Database seeders (seedAll.ts) and test suites
│   ├── package.json          # Backend dependencies
│   └── tsconfig.json         # Backend TypeScript compilation
│
├── package.json              # Root workspace orchestrator
└── README.md
```

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- Node.js >= 18.0.0
- MongoDB instance (local or MongoDB Atlas connection URI)

### 2. Installation
Install all dependencies for root, Frontend, and Backend:
```bash
npm install
npm --prefix Frontend install
npm --prefix Backend install
```

### 3. Environment Configuration
Create environment files from the provided templates:
```bash
# Frontend environment
cp Frontend/.env.example Frontend/.env

# Backend environment
cp Backend/.env.example Backend/.env
```
Update `Backend/.env` with your `MONGODB_URI` connection string.

### 4. Seed Database (Optional)
To populate the database with complete demo data (users, tasks, products, inventory, orders, announcements, documents, chat):
```bash
npm run seed
```

### 5. Start Application
Launch both Backend (`http://localhost:5000`) and Frontend (`http://localhost:5173`) with a single command:
```bash
npm run dev
```

Alternatively, run each service independently:
- Frontend only: `npm run dev:client`
- Backend only: `npm run dev:server`

---

## 🧪 Automated Verification & Testing

The platform includes end-to-end automated verification suites covering business logic, calculations, and RBAC security:

```bash
# Run all Phase 13 tests from root
npm run test

# Run individual verification suites
npm --prefix Backend run test:phase13
npx --prefix Backend tsx src/scripts/verifyPhase12.ts   # Sales, Orders & Expenses
npx --prefix Backend tsx src/scripts/verifyPhase11.ts   # Products & Inventory
npx --prefix Backend tsx src/scripts/verifyPhase10.ts   # Documents & Folders
npx --prefix Backend tsx src/scripts/verifyPhase9.ts    # Goals & OKRs
```

---

## 🏗️ Production Build

To validate TypeScript compilation and create optimized production bundles:
```bash
npm run build
```
This executes:
1. `npm --prefix Frontend run build`: Generates minified production assets in `Frontend/dist/`.
2. `npm --prefix Backend run build`: Compiles server TypeScript to `Backend/dist/`.

---

## 🔒 Security & Privacy Commitments

- **No Surveillance / No Keystroke Logging**: The platform strictly tracks work item progress (task state transitions, document edits, comments) without user activity surveillance or idle detectors.
- **Sanitized Metadata**: All audit logs redact sensitive fields (`password`, `token`, `cookie`, `secret`) before database persistence.
- **Rate Limiting**: Sliding window rate limits block brute-force authentication attacks (10 requests/15m) and abusive data exports (20 requests/15m).
- **Security Headers**: Standard defense-in-depth headers applied on every HTTP response (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection: 1; mode=block`).

---

## 🌿 Lavanta Naturals Platform Team
Maintained for internal operations. Built with love for pure wellness and operational excellence.
