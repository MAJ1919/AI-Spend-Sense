# SpendSense AI — مساعدك المالي الذكي 👛

An elegant, Arabic-first AI-powered financial assistant and expense tracker MVP. SpendSense AI helps users log expenses in conversational natural language, parses them automatically into structured ledger transactions, alerts them about budget drains, and identifies hidden subscriptions.

---

## 🚀 Key Features

* **Interactive Onboarding Flow**: A gorgeous 3-step walkthrough collecting the user's name, monthly income (salary), and initial budget limits for key categories (Food, Transport, Subscriptions, Entertainment).
* **Conversational AI Logger**: Powered by a local natural language parser (integrated with custom Agent API capabilities). Log items by typing naturally:
  * *Arabic example:* `"نون 78 ريال، قهوة جبل 22، نتفلكس 55"`
  * *English example:* `"coffee 15, uber 40"`
* **Visual Expense Alerts**: Progress indicators visualizing weekly spending trends against budgets (e.g. food delivery spikes, entertainment savings).
* **Subscription Tracker (المصاريف الخفية)**: Scans logs to identify recurrent drafts (Netflix, Shahid, Anghami) and enables direct simulation requests to cancel suspicious subscriptions.
* **Financial Advisory Card**: Summarizes habits, highlighting budget anomalies and potential monthly savings with an embedded responsive sparkline vector chart.
* **Transaction Ledger (سجل المعاملات)**: Fully searchable history ledger filterable by categories.
* **Responsive Settings**: Tailor profile details, adjust currency, and configure category budgets with real-time sliders.

---

## 🛠️ Technology Stack

* **Frontend**: React 18 + TypeScript + Vite
* **Routing**: React Router DOM (v6)
* **Styling**: Tailwind CSS (v4) + Custom Glassmorphism Utilities
* **State Management**: Zustand (with browser `localStorage` persistence)
* **Animations & Icons**: Framer Motion + Lucide React

---

## 📦 Installation & Setup

### Prerequisites
Make sure you have [Node.js](https://nodejs.org) (v18 or higher) installed.

### 1. Install Dependencies
Navigate to the project root and run:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template variables file to create your local configurations file:
```bash
cp .env.example .env
```
Open `.env` in a text editor and configure your custom Agent API endpoint if connecting to a live backend:
```env
AGENT_API_URL=https://your-custom-agent-endpoint.com
AGENT_API_KEY=your_secure_api_key_here
```
*(If left blank, the app gracefully falls back to the high-fidelity mock Watsonx chat simulation.)*

### 3. Run Locally
Start the local development server:
```bash
npm run dev
```
The app will open automatically at `http://localhost:3000`.

### 4. Build for Production
To compile and bundle the static assets for deployment:
```bash
npm run build
```
The compiled build output will be placed in the `dist/` directory.

---

## 📁 Folder Structure

```text
├── .env.example          # Environment variables template
├── .env                  # Local variables configuration file (Git-ignored)
├── package.json          # Dependency manager script config
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration with Tailwind v4 integrations
├── index.html            # Main entry point mounting React
└── src/
    ├── App.tsx           # Router layout shell and global Context provider
    ├── main.tsx          # React renderer root
    ├── styles.css        # Tailwind directive imports and custom glass styles
    ├── components/
    │   └── spendsense/
    │       ├── OnboardingStack.tsx  # Interactive Onboarding questions stack
    │       ├── ChatBubble.tsx       # Message bubbles rendering layout
    │       └── CoachingStack.tsx    # Advisor charts and financial reports
    ├── lib/
    │   ├── types.ts      # TypeScript models for Transactions & Subscriptions
    │   └── spendsense/
    │       ├── store.ts  # Persistent Zustand global store
    │       └── parser.ts # Natural language parsing engine
    └── pages/
        ├── Dashboard.tsx # Chat interface, alerts card, and action suggestions
        ├── History.tsx   # Transaction search logs and category filters
        └── Settings.tsx  # Profile updates, salary slider, and category limits
```

---

## 📄 License
This project is licensed under the MIT License.
