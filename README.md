# Jatham — 100% Free Deployment Guide

> This guide explains how to host and run the entire Jatham platform at **ZERO COST** using modern free-tier services.

---

## 🏗️ The "Zero Cost" Stack

| Layer | Service | Why? |
|---|---|---|
| **Frontend** | [Vercel](https://vercel.com) | Permanent free tier for personal projects. |
| **Backend** | [Render](https://render.com) | Free tier for Web Services (Node.js). |
| **Database** | [MongoDB Atlas](https://mongodb.com/atlas) | M0 Free Cluster (512MB - plenty for 10k users). |
| **Redis (Cache)** | [Upstash](https://upstash.com) | Serverless Redis (10,000 requests/day for free). |
| **AI (Reports)** | [Gemini AI](https://aistudio.google.com) | **Google Gemini 1.5 Flash** (15 RPM, $0 cost). |
| **Email (OTP)** | [Resend](https://resend.com) | 3,000 emails/month free. No credit card required. |
| **Images** | [Cloudinary](https://cloudinary.com) | 25 Credits/month (Free). |
| **Geocoding** | [OpenCage](https://opencagedata.com) | 2,500 requests/day free. |

---

## 🚀 Step-by-Step Setup

### 1. Database (MongoDB Atlas)
- Create a free cluster.
- In "Network Access", allow `0.0.0.0/0` (Render IPs are dynamic).
- Copy the connection string.

### 2. Backend (Render.com)
- Connect your GitHub repo.
- Select the `backend` folder as the root.
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `MONGODB_URI`: `<Your Atlas Link>`
  - `JWT_ACCESS_SECRET`: `<64 char hex>`
  - `JWT_REFRESH_SECRET`: `<64 char hex>`
  - `GEMINI_API_KEY`: `<From Google AI Studio>`
  - `RESEND_API_KEY`: `<From Resend Dashboard>`
  - `REDIS_URL`: `<From Upstash Dashboard>`
  - `FRONTEND_URL`: `https://your-app.vercel.app`

### 3. Frontend (Vercel)
- Connect your GitHub repo.
- Select the `frontend` folder as the root.
- **Environment Variables**:
  - `VITE_API_URL`: `https://your-render-app.onrender.com/api`

### 4. Redis (Upstash)
- Create a "Global" Redis database.
- Copy the **Connection URL** (starting with `redis://`).

### 5. Email (Resend)
- Create an account.
- Copy the API Key.
- *Note*: On the free tier, you can only send to your own email unless you verify a domain. To verify a domain for free, use a free `.tk` or similar or just use the testing mode.

---

## ⚠️ Important Considerations for "Free"
1. **Render Cold Starts**: On the free tier, the backend "sleeps" after 15 minutes of no use. The first person to visit after a break will wait ~30 seconds for the server to wake up.
2. **Resend Sending Domain**: You will need to add a domain to Resend to send emails to *other* people. You can get free subdomains or use a cheap `.xyz` domain.
3. **Gemini Limits**: 15 requests per minute is plenty for a small family/community app.

---

## Technical Support
If you encounter "API Error" messages, check your Render logs. Most issues are due to missing Environment Variables.

**Now go launch your platform for $0!**
