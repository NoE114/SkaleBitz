# SkaleBitz

SkaleBitz is a Vite/React frontend with an Express backend. All runtime URLs are driven by environment variables so deployments on Vercel (frontend) and Render (backend) stay in sync.

## Environment configuration

- Copy `env.local.example` and `env.production.example` to the appropriate `.env` files for `/Back` and `/Front` to configure `PORT`, `APP_BASE_URL`, `FRONTEND_BASE_URL`, and `VITE_API_URL`.
- `APP_BASE_URL` must point to the backend origin. Use `FRONTEND_BASE_URL` for the deployed frontend origin and `VITE_API_URL` for the backend origin used by the frontend.

## Health checks

- `/health` (platform ping) and `/api/health` (API ping) return `{ ok: true }` for uptime monitors.
