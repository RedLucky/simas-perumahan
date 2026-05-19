# 🏡 SiMas (Citizen Management Information System)

[![Next.js Version](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React Version](https://img.shields.io/badge/React-19.2.4-blue?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind CSS Version](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase Version](https://img.shields.io/badge/Supabase-v2.105-emerald?style=flat-square&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-f6821f?style=flat-square&logo=pwa)](https://web.dev/explore/progressive-web-apps)

**SiMas (Sistem Informasi Manajemen Warga / Citizen Management Information System)** is a modern web-based Progressive Web App (PWA) designed to facilitate citizen administration, monthly dues, incidental contributions, neighborhood cash flow accounts, Ramadan takjil duty scheduling, and community event agendas in a transparent, accurate, and real-time manner.

This application is tailored for neighborhood committees (Admin/Chairperson) to manage data and record transactions, as well as for residents (Public) to view transparent financial reports, agendas, and individual house payment statuses without needing to log in.

---

## 🚀 Key Features

SiMas is built with highly granular features encompassing the administrative needs of a local neighborhood:

### 1. 💳 Monthly Dues Management
*   **Automatic Accumulative Arrears:** Real-time tracking of current bills, previous unpaid balances, and overall payment statuses (`LUNAS`/PAID, `SEBAGIAN`/PARTIAL, `BELUM_BAYAR`/UNPAID).
*   **Rapid Admin Entry:** Interactive form for admin users to record payments quickly per household.
*   **Public Transparency:** Public search and status overview for all 33 active houses (MR-1 to MR-33).

### 2. 💸 Cash Flow & Expense Transparency
*   **Dynamic Expense Classification:** Grouping and recording of outlays based on categories (e.g., Security Guards, Sanitation, Operations).
*   **Real-time Financial Statements:** Automated cash ledger balance (revenue vs. expenses) viewable by any resident.
*   **Staff Payroll Widget:** Dedicated indicator on dashboards to monitor staff salary distributions transparently.

### 3. 🎯 Incidental Dues (Special Events)
*   **Event Manager:** Admins can activate or deactivate yearly incidental events (e.g., Independence Day celebrations, block parties).
*   **Payment Progress Tracking:** Visual indicator of paid/unpaid status for every household per active event.

### 4. 🌙 Ramadan Takjil Schedule
*   **Auto-Draft Generator:** Automatically generates fair, rotating takjil food-distribution duties for the 33 households based on the year and duration of Ramadan.
*   **Swap Schedule Editor:** Interactive scheduler allowing admins to easily swap dates between households for maximum flexibility before publishing.
*   **Instant Publication:** Published schedules immediately synchronize to the public citizen calendar page.

### 5. 📅 Citizen Agenda & Announcements
*   **Digital Notice Board:** Quick community updates and formal notices published by admins.
*   **New Post Notification Badge:** Interactive indicator flagging unread posts using client-side `LocalStorage` history tracking.

### 6. 📊 Reports & Document Export
*   **Monthly & Annual Summaries:** Structured balance sheets to streamline officer transitions and town hall meetings.
*   **Top Arrears Report:** Prioritized list of households sorted by largest unpaid balances to assist in friendly collections.
*   **XLSX & PDF Export:** One-click download of print-ready reports containing official neighborhood letters, complete with names and signature areas.

### 7. 📱 Progressive Web App (PWA) & Mobile-First UX
*   Installable directly to mobile home screens for an app-like experience.
*   Fully responsive designs tailored for screens ranging from small smartphones (minimum width 390px) to full desktop monitors.
*   *Offline fallback* capabilities ensuring continuous accessibility.

---

## 🛠️ Tech Stack & Dependencies

Built with state-of-the-art web technologies for high performance:

*   **Core Framework:** [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling & Design System:** [Tailwind CSS v4](https://tailwindcss.com/) & PostCSS
*   **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security) and `@supabase/ssr`
*   **Schema Validation:** [Zod](https://github.com/colinhacks/zod)
*   **Date Operations:** [Date-fns](https://date-fns.org/)
*   **Document Generators:** [jsPDF](https://github.com/parallax/jsPDF) & [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) (for PDFs), [SheetJS XLSX](https://sheetjs.com/) (for Excel spreadsheets)
*   **PWA Wrapper:** `next-pwa`

---

## 📂 Project Structure

```text
simas/
├── app/                        # Main Next.js project directory
│   ├── public/                 # Static assets & PWA Manifest
│   ├── src/
│   │   ├── app/                # Next.js App Router Pages & API Routes
│   │   │   ├── admin/          # Dashboard & Admin features (protected by Middleware)
│   │   │   ├── agenda/         # Public agenda notice page
│   │   │   ├── api/            # Server Route Handlers (Public & Admin API)
│   │   │   ├── dashboard/      # Main Citizen Dashboard
│   │   │   ├── insidental/     # Public Incidental Dues status
│   │   │   ├── iuran/          # Public Monthly Dues status
│   │   │   ├── jadwal-takjil/  # Public Ramadan Takjil calendar
│   │   │   ├── keuangan/       # Public Cashflow Financial statement
│   │   │   ├── login/          # Admin Portal Login page
│   │   │   └── layout.tsx      # Main layout entry-point
│   │   ├── components/         # Reusable UI Components
│   │   ├── lib/                # Supabase Clients, services, & business logics
│   │   └── types/              # Global TypeScript interfaces and declarations
│   ├── supabase/               # Supabase database config folder
│   │   ├── migrations/         # Migration SQL files (Schemas, Views, Triggers, RLS)
│   │   ├── seeds/              # Initial seed file (Active Houses MR-1 to MR-33)
│   │   └── README.md           # Database setup instructions
│   ├── package.json            # NPM dependencies & task runners
│   └── tsconfig.json           # TypeScript configuration
└── IMPLEMENTATION_BACKLOG.md  # Detailed MVP -> v1 task backlog and features map
```

---

## ⚙️ Installation & Setup Guide

Follow these steps to run the SiMas project on your local machine:

### 1. Prerequisites
Make sure you have the following installed:
*   [Node.js](https://nodejs.org/) (Version 18.x or higher, v20+ recommended)
*   NPM (packaged with Node.js) or alternate package manager (Yarn, PNPM, Bun)
*   An active [Supabase](https://supabase.com/) project (or local Supabase setup using Docker)

### 2. Clone the Repository
```bash
git clone https://github.com/username/simas.git
cd simas
```

### 3. Install Dependencies
Navigate into the `app` directory and install all packages:
```bash
cd app
npm install
```

### 4. Database Setup & Migrations
You need to initialize the PostgreSQL database schema in your Supabase project:
1.  Go to your **Supabase Dashboard** and navigate to your project.
2.  Open the **SQL Editor** tab.
3.  Run the contents of the following files in order:
    *   First, the main schema: `supabase/migrations/2026051201_init_simas.sql`
    *   Second, the latest updates: `supabase/migrations/2026051901_add_house_contact_fields.sql`
    *   Third, the household seeding file: `supabase/seeds/2026051201_seed_houses.sql`
4.  *(Optional)* Insert a starting billing rate in `dues_rates` to instantly initialize calculations:
    ```sql
    INSERT INTO public.dues_rates (amount, effective_month, note, created_by_name_snapshot)
    VALUES (100000, DATE '2026-01-01', 'Initial standard dues', 'System Init');
    ```

### 5. Setup Environment Variables
Create a `.env` file in the `app/` folder by copying the example template:
```bash
cp .env.example .env
```
Fill in the variables with your Supabase credentials found in Project Settings > API:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. Run the Development Server
Start the local Next.js server:
```bash
npm run dev
```
Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)** to view the application.

---

## 🧪 Testing & Code Quality

We hold our codebase to high standards of clean code and type safety:

### Run Unit & Integration Tests
Execute the native Node test runner (`tsx`) to verify critical calculations such as arrears logic and cash summary aggregation:
```bash
npm run test
```

### Type Checking & Linting
Verify there are no syntax or type errors before submitting Pull Requests:
```bash
# Verify TypeScript compile-time safety
npm run type-check

# Run ESLint validation
npm run lint
```

---

## 🔒 Security Architecture (Supabase RLS)

Citizen transaction records are secured at the database layer using PostgreSQL **Row Level Security (RLS)**:
*   **Public Access (Unauthenticated):** Granted **Read-Only (SELECT)** privileges on announcements, dues payment histories, active events, expenses, and published takjil schedules to guarantee full transparency.
*   **Admin Access (Committee Members):** Granted **Full CRUD (INSERT, UPDATE, DELETE)** privileges across all schemas. Admin identities are verified through Supabase Auth mapping into the `admin_profiles` table.
*   **Router Level Middleware Protection:** Any requests targeting `/admin/*` directories or `/api/admin/*` endpoints are validated via Next.js server middleware to instantly reject unauthorized requests.

To register your **First Admin**:
1. Sign up a new user via Supabase Auth (Sign Up).
2. Manually insert a row into the `admin_profiles` table linking the user's `id` (UUID) from Supabase Auth:
```sql
INSERT INTO public.admin_profiles (id, email, full_name)
VALUES ('your-user-uuid', 'admin-email@domain.com', 'Admin Chairperson');
```

---

## 🤝 Developer Workflow (Git Guidelines)

To maintain a healthy production branch, all developers must comply with these guidelines:

1.  **Branching Strategy:** Work must be done in feature branches created off `main` named as:
    `feat/<area>-<slug>` or `fix/<area>-<slug>`.
    *Examples:* `feat/iuran-arrears-calc` or `fix/takjil-swap-bug`.
2.  **Definition of Done (DoD):**
    *   Code must pass `npm run lint` and `npm run type-check`.
    *   Write at least one unit/integration test covering critical parts of any modified business logic.
    *   Ensure layout responsive design works perfectly down to mobile viewport limits (minimum 390px).
    *   Validate that database RLS rules and access controls are fully respected.

---

## 📄 License

Copyright © 2026. All rights reserved.  
Developed to support administrative digitization of residential neighborhoods with absolute transparency and accountability.
