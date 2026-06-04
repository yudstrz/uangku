# Uangku - Enterprise Personal Finance Management System

Uangku is a web-based personal finance management application engineered to facilitate comprehensive tracking of income, expenditure, and financial targets. Designed with an architecture optimized for responsiveness, secure user authentication, and real-time database updates, the application provides individuals with the analytical tools necessary to govern their cash flow and monitor their budgets.

---

## System Architecture / Tech Stack

The application is structured upon a modern, full-stack JavaScript architecture using the following core components:

*   **Frontend Framework**: Next.js 14 (leveraging React and the App Router pattern for optimized routing and layout management).
*   **Programming Language**: TypeScript (ensuring end-to-end type safety across client interfaces and server-side routes).
*   **Styling & Design System**: Tailwind CSS coupled with Vanilla CSS (providing a responsive interface compatible with light and dark mode settings).
*   **Authentication & Security**: NextAuth.js (configured with Credentials Provider and session tokens) alongside bcryptjs for secure password hashing.
*   **Database Engine**: LibSQL Client / Turso Database (a SQLite-compatible database-as-a-service designed for edge hosting and low-latency queries).
*   **Data Visualization**: Chart.js integration via react-chartjs-2 (used to render cash flow distributions and category-wise spending statistics).
*   **Notification Utility**: nextjs-toast-notify (providing real-time interactive toast notifications).
*   **Email Delivery Service**: Resend API (powering account verification and token-based password reset procedures).
*   **Document Generation & Exports**: jsPDF, html2canvas, and html-to-image (allowing users to download local financial reports).

---

## Key Features

1.  **Dynamic Financial Dashboard**: Aggregates total balance, period-based income, and period-based expenses. Includes interactive bar charts for monthly breakdowns and pie charts for visual expenditure distribution.
2.  **Transaction Ledger**: A unified table interface supporting full create, read, update, and delete (CRUD) operations on income and expense transactions.
3.  **Unified Account Management**: Consolidates balance tracking across diverse account types, including cash, bank accounts, credit cards, and investments.
4.  **Custom Expense & Income Categories**: Allows users to instantiate custom categories complete with designated names, colors, and transaction types.
5.  **Targeted Budget Planning**: Allows users to specify monthly spending thresholds per category. Progress bars automatically indicate the proportion of budget consumed.
6.  **Real-Time Daily Summary**: Evaluates and displays the exact expenses incurred during the current day, categorized and sorted by transaction volume.
7.  **Dynamic Budget Pacing (Daily Limit Calculator)**: A pacing calculator that computes the maximum daily allowance to keep the monthly category budget on track. Computed as `Remaining Budget / Remaining Days in the Month`, it updates dynamically as expenses are recorded.
8.  **Automated Authentication Flow**: Protects application routes from unauthorized access, provides session controls, and features an integrated email-based password recovery flow using expiring tokens.
9.  **Preference Configuration**: Offers support for multi-currency displays and system-aware light/dark color schemes.

---

## Project Structure

Below is the directory structure highlighting the primary architectural components of the codebase:

```text
uangku/
├── public/                     # Static assets and PWA manifest resources
├── src/
│   ├── app/                    # Next.js App Router root layout and routes
│   │   ├── (auth)/             # Authenticated route groups
│   │   │   ├── accounts/       # Bank, cash, and credit card management pages
│   │   │   ├── auth/           # Sign-in, sign-up, password recovery pages
│   │   │   ├── budget/         # Budget pages, daily summaries, and forms
│   │   │   ├── categories/     # Custom category configuration pages
│   │   │   ├── dashboard/      # Interactive dashboard page
│   │   │   ├── profile/        # User settings and currency options page
│   │   │   ├── reports/        # Financial reports and analytics page
│   │   │   └── transactions/   # Transaction tables and edit components
│   │   ├── api/                # Backend API routes
│   │   │   ├── accounts/       # CRUD API endpoints for user accounts
│   │   │   ├── auth/           # API endpoints for authentication and password resets
│   │   │   ├── budget/         # API endpoints for budget targets and daily pacing summaries
│   │   │   ├── categories/     # CRUD API endpoints for transaction categories
│   │   │   ├── dashboard/      # Aggregated dashboard metrics API endpoint
│   │   │   ├── profile/        # User preference update API endpoints
│   │   │   ├── reports/        # Periodic metrics and analytics aggregation API endpoints
│   │   │   └── transactions/   # CRUD API endpoints for transaction records
│   │   ├── layout.tsx          # Main application entry wrapper
│   │   ├── page.tsx            # Base root redirection entry point
│   │   └── Providers.tsx       # React context and session providers
│   ├── components/             # Reusable UI component modules
│   │   ├── form/               # Reusable form field elements
│   │   ├── Button.tsx          # Configurable action button component
│   │   ├── Card.tsx            # Standard container card component
│   │   ├── ChartComponent.tsx  # Wrapper component for Chart.js rendering
│   │   ├── DataTable.tsx       # Sortable/searchable record listing component
│   │   └── Navigation.tsx      # Responsive header and side navigation component
│   ├── lib/                    # Database configurations and helper utilities
│   │   ├── auth.ts             # Authentication helper and middleware check
│   │   ├── authOptions.ts      # NextAuth configuration credentials provider and callbacks
│   │   ├── email.ts            # Resend email template dispatch methods
│   │   ├── init-db.ts          # Database migrations command line trigger script
│   │   ├── schema.ts           # Database DDL statements and migration scripts
│   │   └── turso.ts            # Turso database client instantiation
│   └── types/                  # TypeScript interface and type declarations
│       └── index.ts            # Global data models and helper functions
├── tailwind.config.js          # Tailwind CSS spacing and theme settings
└── tsconfig.json               # TypeScript build options
```

---

## Getting Started

Follow the configuration steps below to build and deploy the application in a local development environment.

### Prerequisites

Ensure you have installed the following software dependencies:

*   Node.js version 18.0.0 or higher.
*   npm (or yarn) package manager.
*   An active Turso Database account with a provisioned database.
*   A registered Resend account to obtain API keys for transaction emails.

### Installation

1.  Clone the source repository:
    ```bash
    git clone https://github.com/yudstrz/uangku.git
    cd uangku
    ```

2.  Install the required package dependencies:
    ```bash
    npm install
    ```

3.  Configure your environment variables as detailed in the **Environment Variables** section.

4.  Execute the database initialization script to apply DDL schema statements to your Turso Database:
    ```bash
    npm run db:init
    ```

5.  Launch the Next.js local development server:
    ```bash
    npm run dev
    ```

6.  Open a web browser and navigate to `http://localhost:3000` to interact with the application.

---

## Environment Variables

A `.env` file must be created at the root of the project to enable proper database connection, session handling, and email communication. Refer to the parameters below:

| Variable Name | Description | Format / Context |
|---|---|---|
| `TURSO_DATABASE_URL` | Connection string for your Turso Database instance. | `libsql://your-database-slug.turso.io` |
| `TURSO_AUTH_TOKEN` | Authentication credentials token provided by the Turso dashboard. | Long alphanumeric token |
| `NEXTAUTH_SECRET` | Secret hash utilized by NextAuth.js to sign session JWTs. | Random cryptographic string |
| `NEXTAUTH_URL` | The canonical base URL of the web application. | `http://localhost:3000` |
| `RESEND_API_KEY` | Authorization key for dispatching emails through Resend. | `re_your_api_key_characters` |

---

## Usage

### User Authentication

1.  Navigate to `http://localhost:3000/auth/signup` to register a new user profile.
2.  Log in at `http://localhost:3000/auth/signin` using the credentials supplied. Enabling the "Remember Me" checkbox will persist the NextAuth session token for 30 days.

### Budget Pacing Operations

To set up financial boundaries and monitor pacing statistics:

1.  Configure transaction categories by navigating to the Categories tab and setting up target expenses.
2.  Navigate to the Budget tab, select the active month, and click **Add Budget** to assign a spending cap to a category.
3.  The **Daily Spend Summary** automatically tracks transactions on the current calendar day and categorizes them.
4.  The system computes the **Batas Harian** (pacing limit) dynamically. For example, if you assign a monthly category budget of IDR 3,000,000 and spend IDR 500,000 by the fourth day of a 30-day month, the calculation is performed as:
    
    ```text
    remainingBudget = 3,000,000 - 500,000 = 2,500,000
    remainingDays = 30 - 4 + 1 = 27
    dailyLimit = 2,500,000 / 27 = 92,593
    ```

    The dashboard updates this pacing limit in real-time, showing visual indicators depending on the ratio of today's spending relative to this calculated limit.

---

## License

This software is distributed under a custom personal-use license. See the [LICENSE](LICENSE) file for the full terms. Commercial use, redistribution, and sublicensing of this application are strictly prohibited.
