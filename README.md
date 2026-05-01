# Jatham — Vedic Matchmaking Platform

> Complete Thirumana Porutham matchmaking with AI synthesis, Dosha analysis, and PDF reports.  
> Built for South Indian Tamil families. DPDP Act 2023 compliant.

---

## Architecture

```
Frontend (React + Vite PWA)  ─→  Vercel
Backend  (Express + Node 20) ─→  Railway
Database (MongoDB)           ─→  MongoDB Atlas
Cache    (Redis + BullMQ)    ─→  Railway Redis
CDN      (Cloudflare)        ─→  In front of Vercel + Railway
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas free tier)
- Redis (optional — PDF queue degrades gracefully without it)

### 1. Clone & Install
```bash
git clone https://github.com/AdithiyanVivekanandan/jatham.git
cd jatham
npm run install:all
```

### 2. Configure Backend
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

Minimum required for local dev:
```env
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/jatham
JWT_ACCESS_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<generate: same command, different output>
```

### 3. Seed the Database
```bash
npm run seed
```

### 4. Run Both Servers
```bash
# Terminal 1 — Backend (port 5000)
npm run dev:backend

# Terminal 2 — Frontend (port 3000, proxies /api → :5000)
npm run dev:frontend
```

Open: http://localhost:3000

---

## Deployment

### 8.1 — MongoDB Atlas
1. Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user and whitelist `0.0.0.0/0` (Railway IPs are dynamic)
3. Copy the connection string → use as `MONGODB_URI` in Railway

### 8.2 — Railway (Backend + Redis)
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select the `jatham` repo → set **Root Directory** to `backend`
3. Add a **Redis** service to the same project
4. Set environment variables (see [§ Environment Variables](#environment-variables))
5. Railway auto-detects `railway.json` and runs `npm start`

**Required Railway variables:**
```
NODE_ENV=production
MONGODB_URI=<Atlas connection string>
JWT_ACCESS_SECRET=<64 hex chars>
JWT_REFRESH_SECRET=<different 64 hex chars>
FRONTEND_URL=https://jatham.app
REDIS_URL=<Railway Redis internal URL>
ANTHROPIC_API_KEY=<your key>
CLOUDINARY_CLOUD_NAME=<your cloud>
CLOUDINARY_API_KEY=<your key>
CLOUDINARY_API_SECRET=<your secret>
OPENCAGE_API_KEY=<your key>
TWILIO_ACCOUNT_SID=<your SID>
TWILIO_AUTH_TOKEN=<your token>
TWILIO_PHONE_NUMBER=<your number>
```

### 8.3 — Vercel (Frontend)
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select `jatham` repo → set **Root Directory** to `frontend`
3. Vercel auto-detects Vite. Build command: `npm run build`, Output: `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://<your-railway-domain>/api
   ```

### 8.4 — GitHub Actions CI/CD
Add these secrets in **GitHub → Settings → Secrets → Actions**:

| Secret | How to get it |
|---|---|
| `RAILWAY_TOKEN` | Railway → Account → Tokens → Create |
| `RAILWAY_SERVICE_ID` | Railway → Project → Service → Settings |
| `BACKEND_HEALTH_URL` | `https://<railway-domain>/health` |
| `VERCEL_TOKEN` | Vercel → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Run `vercel link` in `/frontend`, check `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Same file as above |
| `VITE_API_URL` | Your Railway backend URL + `/api` |

After adding secrets — push to `main` to trigger the pipeline.

### 8.5 — Cloudflare
1. Add your domain in Cloudflare DNS
2. Point to Vercel: Add CNAME `@` → `cname.vercel-dns.com` (Proxied ☁️)
3. Point API: Add CNAME `api` → `<your-railway-domain>` (Proxied ☁️)
4. **SSL/TLS** → Set to **Full (Strict)**
5. **Security** → WAF → Enable Managed Ruleset
6. **Page Rules** → Add:
   - `*jatham.app/api/*` → Cache Level: Bypass
   - `*jatham.app/assets/*` → Cache Level: Cache Everything, Edge TTL: 1 month

---

## Environment Variables

See [`backend/.env.example`](backend/.env.example) for full backend list.  
See [`frontend/.env.example`](frontend/.env.example) for frontend variables.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Framer Motion, Recharts |
| PWA | vite-plugin-pwa, Workbox |
| Mobile | Capacitor 8 (Android) |
| Backend | Express 5, Node 20 |
| Database | MongoDB (Mongoose) + CSFLE encryption |
| Queue | BullMQ + Redis |
| Auth | JWT (HS256) + OTP via Twilio + bcrypt |
| AI | Claude claude-sonnet-4-5 (Anthropic) |
| Photo | Cloudinary |
| PDF | jsPDF (6-page report) |
| Security | Helmet, mongoSanitize, xss-clean, rate-limit, bruteForce.js |

---

## Running Tests
```bash
npm test
# Runs vitest with mongodb-memory-server — no real DB needed
```

---

## Legal & Compliance
- DPDP Act 2023: `DELETE /api/users/me` hard-deletes all user data
- Disclaimer modal required before viewing match results (per masterDOCUMENT §11.6)
- Minimum age: 18 years (enforced in Zod schema, DOB field)
- No PII in server logs (auditLogger masks all sensitive fields)

---

## License
UNLICENSED — Private project. All rights reserved.
