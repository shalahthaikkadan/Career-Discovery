# 🌊 Career Discovery | AI Career Navigator

**Stop guessing, start sailing.** Career Discovery is a professional-grade, AI-powered career discovery engine that generates hyper-personalized roadmaps based on your unique interests, values, and problem-solving style.

🔗 **Live Demo:** [https://careerdiscovery.in](https://careerdiscovery.in)

---

## ✨ Features

- **🧠 AI-Powered Analysis:** Uses Google Gemini 3.1 Flash Lite via Google AI Studio (with OpenRouter fallback) to generate divergent career avenues and actionable roadmaps.
- **🧭 Divergent Career Pathways:** Every assessment crafts 3 distinct directions:
  - **Mainstream:** Conventional, direct professional track.
  - **Adjacent:** Allied discipline heavily leveraging overlapping skills.
  - **Wildcard:** Emerging, unconventional, future-oriented specialization.
- **🗺️ Interactive Step Deep Dives:** On-demand generation of comprehensive study guides (Core Concepts, Weekly Milestones, Hands-on Mini Project, and Curated Resources).
- **💬 Live AI Mentor Chat:** Context-aware, age-appropriate interactive mentor built directly into each roadmap step.
- **🔐 Secure Authentication:** User accounts with Django-compatible PBKDF2-SHA256 password hashing and JWT access & refresh tokens.
- **⚡ Edge-Native Architecture:** Sub-millisecond cold starts and global distribution powered by Cloudflare Workers and Cloudflare Pages.
- **📱 Neubrutalist Design:** High-contrast, bold borders, and vibrant "pop" aesthetic, meticulously responsive across Mobile, Tablet, and Desktop.
- **🛡️ Production Hardened:**
  - Automated CI/CD pipeline via GitHub Actions using Cloudflare Wrangler.
  - Managed PostgreSQL database on Supabase (PostgREST HTTPS client eliminates connection pool exhaustion).
  - Forced HTTPS and automatic SSL/TLS termination at the Cloudflare edge.
  - Transparent JWT access-token refresh interceptor with queued retries on 401.

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS (Neubrutalism design)
- **Animations:** Framer Motion
- **Icons:** Lucide-React
- **Routing:** React Router 7
- **Hosting:** Cloudflare Pages (Global Edge CDN with SPA `_redirects`)

### Backend (Edge Worker)

- **Runtime:** Cloudflare Workers (V8 Isolate)
- **Framework:** Hono (TypeScript)
- **Auth:** PBKDF2-SHA256 (Django compatible) + HS256 JWT
- **Database:** PostgreSQL (Managed by Supabase via PostgREST HTTPS Client)
- **AI (Primary):** Google AI Studio — Gemini 3.1 Flash Lite (`gemini-3.1-flash-lite`)
- **AI (Fallback):** OpenRouter API (`google/gemini-2.0-flash-001`)

### Infrastructure & CI/CD

- **Edge Compute:** Cloudflare Workers (`career-discovery-api` on `api.careerdiscovery.in`)
- **Frontend Hosting:** Cloudflare Pages (`career-discovery-frontend` on `careerdiscovery.in`)
- **DNS & SSL:** Cloudflare Edge DNS
- **Database:** Supabase PostgreSQL
- **CI/CD:** GitHub Actions via `cloudflare/wrangler-action@v3`

---

## 🏗️ Project Structure

```text
├── .github/workflows/
│   └── deploy.yml            # Automated CI/CD deployment to Cloudflare
├── frontend/                 # React 19 + Vite SPA (Cloudflare Pages)
│   ├── public/_redirects     # SPA routing configuration
│   └── src/                  # React UI components and pages
├── worker/                   # TypeScript + Hono API (Cloudflare Worker)
│   ├── src/
│   │   ├── routes/           # Auth, Questions, Assessment, Steps, History
│   │   ├── services/         # Supabase client, PBKDF2 auth, Gemini AI
│   │   ├── types.ts          # Type definitions
│   │   └── index.ts          # Central Hono application
│   └── wrangler.jsonc        # Cloudflare Worker configuration
├── backend/                  # Legacy Django application
├── CLOUDFLARE_SETUP_GUIDE.md # Complete step-by-step setup guide
├── ARCHITECTURE.md           # System architecture overview
└── README.md
```

---

## 🚀 Local Development

### 1. Backend Worker Setup

```bash
cd worker
npm install
```

Create `worker/.dev.vars` with your API keys. Refer to `CLOUDFLARE_SETUP_GUIDE.md` for the required configuration.

Start the Worker:

```bash
npm run dev
```

The Worker runs locally at `http://localhost:8787`.

### 2. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Frontend runs locally at `http://localhost:5173`.

---

## 🚢 Deployment

Deployment is fully automated with GitHub Actions.

Any push to the `main` branch triggers `.github/workflows/deploy.yml`, which:

1. Installs dependencies.
2. Bundles and publishes the Backend Worker to Cloudflare's global edge network via Wrangler.
3. Builds the React SPA using `npm run build`.
4. Deploys the static frontend bundle to Cloudflare Pages.

For manual deployment or initial configuration, follow the **[Cloudflare Setup Guide](./CLOUDFLARE_SETUP_GUIDE.md)**.

---

## 👥 Team

Career Discovery was developed as a collaborative team project.

**Project Lead**
- **Rishad Tharayil** — led the project and handled the majority of the implementation and development.

**Team Members**
- Mohammad Shalah
- Vishnu E
- Ashmil Ofoor
- Raheem

The project represents the combined efforts and contributions of all team members.

---

## 📚 Project Purpose

Career Discovery was developed to help students and individuals explore potential career directions and understand the skills and learning paths associated with different career options.

The platform combines:

- Career assessment
- Generative AI
- Personalized career pathways
- Learning roadmaps
- Study resources
- AI-based mentoring
- Modern web technologies

...to provide an interactive career discovery experience.

---

## 🔒 Security

Do not commit sensitive credentials to GitHub.

**Never expose:**
- `.env`
- `.env.local`
- `.dev.vars`
- API keys
- JWT secrets
- Supabase service role keys
- Cloudflare credentials

Make sure sensitive files are included in `.gitignore`. Example:

```gitignore
.env
.env.*
.dev.vars
node_modules/
dist/
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

### 🌊 Career Discovery
**Stop guessing, start sailing.**

Explore career possibilities, discover your path, and build your roadmap.

</div>
