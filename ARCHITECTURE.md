# 🏗️ System Architecture: CareerSea

This document outlines the technical infrastructure and data flow of the CareerSea platform.

## 💾 Infrastructure Stack
- **Frontend:** React 19 + Tailwind CSS (Vite), deployed on **Cloudflare Pages** (Global Edge CDN with SPA `_redirects`).
- **Backend:** High-performance **Cloudflare Worker** (TypeScript + Hono Edge Framework), deployed at 300+ edge locations.
- **Database:** PostgreSQL (Managed by **Supabase**), queried via Supabase PostgREST HTTPS Client using the Service Role Key (eliminates connection pool exhaustion).
- **Secrets:** **Cloudflare Worker Secrets** (`wrangler secret put`).
- **CI/CD:** **GitHub Actions** deploying via `cloudflare/wrangler-action@v3`.
- **AI Engine (Primary):** Google AI Studio — Gemini 3.1 Flash Lite (`gemini-3.1-flash-lite`) via direct HTTPS `fetch()`.
- **AI Engine (Fallback):** OpenRouter API — controlled by `AI_PROVIDER=openrouter` env var. Model configurable via `OPENROUTER_MODEL`.
- **HTTP Client:** Centralized `api.js` axios instance (frontend) with automatic JWT access-token refresh on 401.

## 🔄 Deployment Pipeline
1. **Local Dev:**
   - Frontend: Vite dev server (`http://localhost:5173`)
   - Worker: Local Wrangler runner (`http://localhost:8787`)
2. **Git Push:** Push to `main` branch triggers `.github/workflows/deploy-cloudflare.yml`.
3. **Build & Deploy:**
   - Worker: Bundled and published to Cloudflare global network via Wrangler CLI.
   - Frontend: Vite builds static bundle to `frontend/dist` and deploys to Cloudflare Pages.
4. **Custom Domains:**
   - `careersea.in` -> Cloudflare Pages (Frontend SPA)
   - `api.careersea.in` -> Cloudflare Worker (Backend API)

## 📊 Data Models
### User (`auth_user`)
- Compatible with Django PBKDF2-SHA256 password hashing.
### Question (`api_question`)
- Represents diagnostic assessment questions.
### UserResponse (`api_userresponse`)
- Links a User to their specific answers.
### CareerSuggestion (`api_careersuggestion`)
- High-level career avenue suggested by the AI (`mainstream`, `adjacent`, `wildcard`).
### RoadmapStep (`api_roadmapstep`)
- Sequential steps/milestones required to achieve the career goal, including on-demand `deep_dive` study guides.
### ChatMessage (`api_chatmessage`)
- Threaded conversation history between the user and the AI mentor for each milestone.

## 🔒 Security Posture
- **SSL / TLS:** Full edge SSL termination managed automatically by Cloudflare.
- **CORS:** Strict origin validation allowing only `careersea.in`, `www.careersea.in`, and verified local development origins.
- **RLS:** Enabled on all Supabase tables to block direct unauthenticated client-side REST access; backend Worker uses secure `service_role` key.
- **JWT Refresh:** Frontend `api.js` interceptor automatically refreshes the access token on 401 and retries the original request.
- **Edge Performance:** 0ms cold starts, global V8 isolate execution, and zero container maintenance overhead.
