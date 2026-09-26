# 🚀 Complete Cloudflare Setup Guide: CareerSea (Workers & Pages)

This guide walks you step-by-step through setting up and launching **CareerSea** on Cloudflare using **Cloudflare Pages** (Frontend) and **Cloudflare Workers** (Backend API).

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Step 1: Obtain Cloudflare Account Credentials](#step-1-obtain-cloudflare-account-credentials)
3. [Step 2: Retrieve Supabase Service Role Key](#step-2-retrieve-supabase-service-role-key)
4. [Step 3: Configure Cloudflare Worker Secrets](#step-3-configure-cloudflare-worker-secrets)
5. [Step 4: Configure Custom Domains](#step-4-configure-custom-domains)
6. [Step 5: Setup GitHub Actions CI/CD Secrets](#step-5-setup-github-actions-cicd-secrets)
7. [Step 6: Local Development Workflow](#step-6-local-development-workflow)
8. [Step 7: Verification & Smoke Testing](#step-7-verification--smoke-testing)

---

## 1. Prerequisites
Before starting, ensure you have:
- A [Cloudflare Account](https://dash.cloudflare.com/)
- Your domain `careersea.in` active on Cloudflare (DNS managed by Cloudflare)
- Access to your [Supabase Dashboard](https://supabase.com/dashboard)
- A [Google AI Studio API Key](https://aistudio.google.com/) (or OpenRouter API Key)
- Node.js 20+ installed locally

---

## Step 1: Obtain Cloudflare Account Credentials

### 1.1 Find Your Account ID
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Select any domain or click **Workers & Pages** in the left sidebar.
3. In the right sidebar, scroll down to **Account Details**.
4. Copy your **Account ID** (a 32-character hexadecimal string).

### 1.2 Generate an API Token
1. Go to **My Profile** (top-right avatar) -> **API Tokens** (or visit [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)).
2. Click **Create Token**.
3. Scroll down and choose **Create Custom Token**.
4. Set **Token Name**: `careersea-deploy-token`.
5. Under **Permissions**, add:
   - `Account` | `Workers Scripts` | `Edit`
   - `Account` | `Workers Tail` | `Read`
   - `Account` | `Cloudflare Pages` | `Edit`
   - `Zone` | `DNS` | `Edit` *(if you want automatic custom domain routing)*
6. Under **Account Resources**: Include -> `All accounts` (or select your account).
7. Under **Zone Resources**: Include -> `All zones` (or select `careersea.in`).
8. Click **Continue to summary** -> **Create Token**.
9. **Copy the token immediately and store it securely.** (Cloudflare will not display it again).

---

## Step 2: Retrieve Supabase Service Role Key

Because the Worker runs in a secure, serverless edge environment, it communicates with Supabase using the **Service Role Key** over HTTPS. This bypasses client-side RLS and provides full backend data access without PostgreSQL connection pool exhaustion.

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard/project/qhrmenvunfcykvmpyshb).
2. Click **Project Settings** (gear icon in the bottom-left sidebar).
3. Navigate to **API** in the sidebar.
4. Under **Project API keys**, locate the key labeled `service_role` (it is marked with a red warning: *“secret, bypasses Row Level Security”*).
5. Click **Reveal** and copy the key.

---

## Step 3: Configure Cloudflare Worker Secrets

Your Cloudflare Worker requires these secrets:
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role secret from Step 2.
- `AISTUDIO_API_KEY`: Your Google AI Studio API key.
- `JWT_SECRET`: A secure random string used to sign and verify JWT authentication tokens.
- `SEED_SECRET`: A separate one-time setup secret for the protected seed endpoint.
- `OPENROUTER_API_KEY`: *(Optional)* If using `AI_PROVIDER=openrouter`.

### Option A: Set Secrets via Wrangler CLI (Recommended)
Run the following commands inside the `worker/` directory:

```bash
cd worker

# 1. Supabase Service Role Key
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# When prompted, paste your Supabase service_role key

# 2. Google AI Studio API Key
npx wrangler secret put AISTUDIO_API_KEY
# When prompted, paste your Gemini API key

# 3. JWT Signing Secret (generate any secure 32+ character random string)
npx wrangler secret put JWT_SECRET
# When prompted, paste your secure string

# 4. Seed endpoint secret (used only during initial setup)
npx wrangler secret put SEED_SECRET
# When prompted, paste a separate secure random string

# 5. (Optional) OpenRouter API Key if you use OpenRouter
npx wrangler secret put OPENROUTER_API_KEY
```

### Option B: Set Secrets in the Cloudflare Dashboard
1. Go to **Workers & Pages** -> select `careersea-api` (after first deploy).
2. Click **Settings** -> **Variables and Secrets**.
3. Under **Secrets**, click **Add** for each key and paste the value.

---

## Step 4: Configure Custom Domains

### 4.1 Frontend Custom Domain (`careersea.in`)
1. In Cloudflare Dashboard, go to **Workers & Pages**.
2. Select your Pages project: `careersea-frontend`.
3. Click the **Custom Domains** tab.
4. Click **Set up a domain**.
5. Enter `careersea.in` and click **Continue**.
6. Cloudflare will automatically configure the DNS record (`CNAME`) and issue an SSL/TLS certificate.
7. Repeat to add `www.careersea.in` if desired.

### 4.2 Backend Custom Domain (`api.careersea.in`)
1. In Cloudflare Dashboard, go to **Workers & Pages**.
2. Select your Worker: `careersea-api`.
3. Click the **Settings** tab -> **Triggers**.
4. Scroll down to **Custom Domains** and click **Add Custom Domain**.
5. Enter `api.careersea.in` and click **Add Custom Domain**.
6. Cloudflare will automatically bind the Worker to `api.careersea.in` and manage DNS.

---

## Step 5: Setup GitHub Actions CI/CD Secrets

The new workflow in `.github/workflows/deploy-cloudflare.yml` automatically builds and deploys both the Worker and Pages on every push to `main`.

1. Go to your GitHub repository: `https://github.com/rishadtharayil/CareerSea`.
2. Click **Settings** -> **Secrets and variables** -> **Actions**.
3. Under **Repository secrets**, click **New repository secret**.
4. Add the following secrets:
   - **`CLOUDFLARE_API_TOKEN`**: The API token you created in Step 1.2.
   - **`CLOUDFLARE_ACCOUNT_ID`**: Your Cloudflare Account ID from Step 1.1.

---

## Step 6: Local Development Workflow

You can run both the Frontend and the Cloudflare Worker locally.

### 6.1 Setup Local Worker Environment
Create a file named `worker/.dev.vars` (this is automatically gitignored):

```ini
AI_PROVIDER=aistudio
AISTUDIO_MODEL=gemini-3.1-flash-lite
AISTUDIO_API_KEY=your_google_ai_studio_api_key_here
SUPABASE_URL=https://qhrmenvunfcykvmpyshb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
JWT_SECRET=your_local_development_jwt_secret_12345
```

### 6.2 Start the Worker Locally
```bash
cd worker
npm run dev
```
The Worker runs at `http://localhost:8787`.

### 6.3 Start the Frontend Locally
In another terminal:
```bash
cd frontend
# Ensure frontend/.env.development points to your local worker or API:
# VITE_API_BASE_URL=http://localhost:8787
npm run dev
```
The Frontend runs at `http://localhost:5173`.

---

## Step 7: Verification & Smoke Testing

### 7.1 Verify Health Check
Open your browser or run:
```bash
curl https://api.careersea.in/api/health/
# Expected response: {"status":"healthy","edge":true}
```

### 7.2 Seed Initial Questions (If Needed)
If you are deploying on a fresh database without questions:
```bash
curl -X POST -H "X-Seed-Secret: YOUR_SEED_SECRET" https://api.careersea.in/api/seed/
# Expected response: {"message":"Successfully seeded questions.", ...}
```

### 7.3 Test Diagnostic Assessment
1. Open `https://careersea.in` in your browser.
2. Click **Set Sail**.
3. Verify questions load from the Cloudflare Worker edge.
4. Complete the assessment and submit.
5. Verify 3 distinct career avenues (`mainstream`, `adjacent`, `wildcard`) are generated with roadmaps.
6. Click into a milestone, verify the Deep Dive study guide is generated and interactive chat works.

🎉 **Your CareerSea platform is now fully running on Cloudflare Workers and Pages with zero server overhead and lightning-fast edge performance!**
