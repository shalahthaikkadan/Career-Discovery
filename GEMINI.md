# 📜 Project Guidelines: CareerSea

This document contains foundational mandates for all AI agents and contributors working on CareerSea. Adhere to these principles strictly to ensure consistent, high-quality development.

## 🎯 Core Mission
CareerSea is a **Career Discovery Engine**, not just a roadmap generator. Our goal is to help users explore unknown professional territories and build actionable blueprints for their future.

## 🛠️ Engineering Standards

### 1. The "Surgical" Principle
- **No Side Effects:** When fixing a bug or adding a feature, do not modify unrelated files or global styles.
- **Explicit over Implicit:** Prefer explicit code over "magical" abstractions.

### 2. Full-Stack Consistency
- **Backend First:** Always ensure the API and Database models are updated before the Frontend.
- **Validation:** Every backend endpoint MUST include proper input validation and error handling.
- **Type Safety:** Maintain clear data structures between the Python backend and React frontend.

### 3. Production Hardening
- **Zero Secrets:** Never hardcode keys. Use Environment Variables and Secret Manager.
- **Security Headers:** All new endpoints must respect existing CORS, CSRF, and HSTS configurations.
- **Cost Efficiency:** Always consider the cost of AI tokens and Cloud resources (e.g., preference for Supabase/Serverless).

### 4. UI/UX: Neubrutalism
- **Bold Identity:** Maintain the high-contrast, heavy-border, and "pop" shadow aesthetic.
- **Mobile First:** Every component must be tested for responsiveness before being committed.
- **Accessibility:** Use semantic HTML tags and maintain readable contrast ratios.

## 🚀 Workflow Mandates
1. **Research:** Analyze existing `models.py` and `settings.py` before proposing changes.
2. **Strategy:** Use `enter_plan_mode` for any feature that touches more than two files.
3. **Execution:** Commit small, logical changes with clear, descriptive messages.
4. **Validation:** Verify changes on the live Cloud environment using revision logs.

## 📚 Reference Files
- `ARCHITECTURE.md`: Technical stack and deployment flow.
- `PRODUCT_GUIDELINES.md`: Vision, ethos, and feature roadmap.
- `README.md`: Public-facing project overview.
