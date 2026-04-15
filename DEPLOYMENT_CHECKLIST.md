# Quick Deployment Checklist

## Pre-Deployment (Local Setup)
- [ ] Verify project runs locally: `npm run dev` (backend) & `npm start` (frontend)
- [ ] All tests pass locally
- [ ] Push all changes to GitHub main branch
- [ ] Create `.env` files (never commit these!)

## Step 1: MongoDB Atlas (5-10 minutes)
- [ ] Create MongoDB Atlas account
- [ ] Create free M0 cluster
- [ ] Create database user with strong password
- [ ] Configure Network Access (allow 0.0.0.0)
- [ ] Get connection string: `mongodb+srv://...`

## Step 2: Deploy Backend to Render (10-15 minutes)
- [ ] Create Render account (connect GitHub)
- [ ] Create new "Web Service"
- [ ] Connect to GitHub repo
- [ ] Select `backend` build settings:
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Runtime: Node
- [ ] Add environment variables in Render:
  - `MONGODB_URI` = your Atlas connection string
  - `JWT_SECRET` = random long string
  - `NODE_ENV` = production
  - `PORT` = 5000
- [ ] Deploy and wait for "Live" status
- [ ] Copy Render backend URL

## Step 3: Deploy Frontend to Vercel (10-15 minutes)
- [ ] Create Vercel account (connect GitHub)
- [ ] Import project
- [ ] Set root directory: `./frontend`
- [ ] Add environment variable:
  - `REACT_APP_API_URL` = your Render backend URL
- [ ] Deploy and wait for completion
- [ ] Copy Vercel frontend URL

## Step 4: Connect Services (5 minutes)
- [ ] Go back to Render backend settings
- [ ] Update `FRONTEND_URL` = your Vercel URL
- [ ] Redeploy backend
- [ ] Wait for redeployment

## Step 5: Testing (10 minutes)
- [ ] Visit Vercel frontend URL
- [ ] Create new account (test registration)
- [ ] Login (test authentication)
- [ ] Browse users (test API call)
- [ ] Check browser console (F12) - no errors?
- [ ] Test real-time chat (Socket.io)

## Post-Deployment
- [ ] Monitor Render logs for errors
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Share live URLs with team
- [ ] Document URLs in project README

---

## Production URLs After Deployment
- **Frontend:** `https://xxxx.vercel.app`
- **Backend:** `https://xxxx.onrender.com`
- **Database:** MongoDB Atlas (private)

## Troubleshooting Steps
1. Check Render logs: Dashboard → Logs
2. Check Vercel logs: Deployments → Click latest
3. Test backend directly: curl https://your-backend/api/
4. Browser console errors: F12 → Console tab
5. Network requests: F12 → Network tab

---

## Environment Variable Reference

### Backend (.env or Render)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=random_secret_key_here
FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
PORT=5000
```

### Frontend (.env.production or Vercel)
```
REACT_APP_API_URL=https://your-backend.onrender.com
```

---

**Time Estimate:** 40-60 minutes total
**Cost:** FREE (all services have free tiers)
