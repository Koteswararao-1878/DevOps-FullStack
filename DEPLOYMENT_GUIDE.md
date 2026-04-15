# Deployment Guide: Vercel, Render & MongoDB Atlas

This guide will walk you through deploying the Skill Swap Platform to production using:
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

---

## 📋 Table of Contents
1. [MongoDB Atlas Setup](#1-mongodb-atlas-setup)
2. [Render Backend Deployment](#2-render-backend-deployment)
3. [Vercel Frontend Deployment](#3-vercel-frontend-deployment)
4. [Environment Variables](#4-environment-variables-setup)
5. [Testing & Troubleshooting](#5-testing--troubleshooting)

---

## 1. MongoDB Atlas Setup

MongoDB Atlas is a cloud database service. Follow these steps:

### Step 1.1: Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" and sign up with your email or GitHub account
3. Verify your email

### Step 1.2: Create a New Project
1. Click "Create" or "New Project"
2. Name it: `skill-swap-platform`
3. Select "Create Project"

### Step 1.3: Create a Database Cluster
1. Click "Build a Database"
2. Select **"M0 (Free)"** tier for free hosting
3. Select your preferred region (closest to users or default)
4. Click "Create Deployment"
5. Wait 2-3 minutes for cluster creation

### Step 1.4: Create Database User
1. Under "Database Access" → Click "Add New Database User"
2. Enter username: `admin123` (or your choice)
3. Enter password: Create a **strong password** (save it safely!)
4. Click "Create Database User"

### Step 1.5: Configure Network Access
1. Under "Network Access" → Click "Add IP Address"
2. Click "Allow Access from Anywhere" (for development/testing)
   - ⚠️ For production, restrict to specific IPs
3. Click "Confirm"

### Step 1.6: Get Connection String
1. Click "Databases" → Your cluster → "Connect"
2. Select "Drivers"
3. Copy the connection string (it looks like):
```
mongodb+srv://admin123:PASSWORD@cluster0.abc.mongodb.net/?retryWrites=true&w=majority
```
4. Replace `PASSWORD` with your actual password
5. Replace `admin123` with your username
6. **Save this string** - you'll need it for backend environment variables

---

## 2. Render Backend Deployment

Render is a cloud platform for deploying Node.js applications.

### Step 2.1: Prepare Backend for Deployment

Update your `backend/package.json` to include a start script:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

Verify `server.js` is listening on environment variable port:
```javascript
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### Step 2.2: Create Render Account
1. Go to [https://render.com](https://render.com)
2. Click "Get Started" and sign up with GitHub
3. Authorize Render to access your GitHub account

### Step 2.3: Create New Web Service
1. Go to Dashboard → Click "New +"
2. Select "Web Service"
3. Select your GitHub repository: `Koteswarao-1878/DevOps-FullStack`
4. Click "Connect"

### Step 2.4: Configure Web Service
1. **Name:** `skill-swap-backend` (or your choice)
2. **Environment:** Select "Node"
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. **Plan:** Select "Free" (for testing)

### Step 2.5: Add Environment Variables
1. Scroll to "Environment Variables" section
2. Click "Add Environment Variable" for each:

| Key | Value |
|-----|-------|
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://admin123:PASSWORD@cluster0.abc.mongodb.net/skill-swap-platform?retryWrites=true&w=majority` |
| `JWT_SECRET` | Generate a random long string (e.g., use [this generator](https://tool-online.com/en/random-string-generator.php)) |
| `JWT_EXPIRE` | `7d` |
| `FRONTEND_URL` | `https://your-vercel-frontend-url.vercel.app` (add after Vercel deployment) |
| `UPLOAD_DIR` | `./uploads` |
| `MAX_FILE_SIZE` | `5242880` |

### Step 2.6: Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete (3-5 minutes)
3. Once live, you'll see a green checkmark
4. Your backend URL will be: `https://skill-swap-backend.onrender.com` (or similar)

### Step 2.7: Save Backend URL
Copy your Render backend URL - you'll need it for the frontend.

---

## 3. Vercel Frontend Deployment

Vercel makes deploying React apps easy.

### Step 3.1: Prepare Frontend for Deployment

Create `frontend/.env.production`:
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

Your `frontend/package.json` should have build script (already there):
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### Step 3.2: Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up" → Select "GitHub"
3. Authorize and continue

### Step 3.3: Import Project
1. Click "Add New" → "Project"
2. Select your GitHub repository: `Koteswarao-1878/DevOps-FullStack`
3. Click "Import"

### Step 3.4: Configure Project Settings
1. **Framework Preset:** Select "Create React App"
2. **Root Directory:** Select `./frontend`
3. **Build Command:** `npm run build`
4. **Output Directory:** `build`
5. **Install Command:** `npm install`

### Step 3.5: Add Environment Variable
1. Under "Environment Variables"
2. Add:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://your-backend-url.onrender.com` (your Render URL)
3. Add another variable:
   - **Name:** `DISABLE_ESLINT_PLUGIN`
   - **Value:** `true`
4. Click "Add"

### Step 3.6: Deploy
1. Click "Deploy"
2. Wait for deployment (2-3 minutes)
3. Your frontend URL will be: `https://your-project.vercel.app`

### Step 3.7: Update Backend CORS
1. Go back to Render Dashboard
2. Edit your web service environment variables
3. Update `FRONTEND_URL` to your Vercel URL: `https://your-project.vercel.app`
4. Click "Update"

---

## 4. Environment Variables Setup

### Backend Environment Variables (Render)

Create `.env` in your backend directory (for local testing):

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://admin123:PASSWORD@cluster0.abc.mongodb.net/skill-swap-platform?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_super_secret_jwt_key_12345_keep_it_safe
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=https://your-vercel-app.vercel.app

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

### Frontend Environment Variables (Vercel)

Create `frontend/.env.production`:

```env
REACT_APP_API_URL=https://your-render-backend.onrender.com
```

### MongoDB Connection String Format

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

Replace:
- `<username>` - Your MongoDB user
- `<password>` - Your MongoDB password
- `<cluster>` - Your cluster name (from MongoDB Atlas)
- `<database>` - Database name

---

## 5. Testing & Troubleshooting

### Test Backend Deployment

```bash
# Check if backend is running
curl https://your-backend-url.onrender.com/api/health

# Try authentication
curl -X POST https://your-backend-url.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!"}'
```

### Test Frontend Deployment

1. Go to `https://your-vercel-app.vercel.app`
2. Try to register a new account
3. Check browser console for any errors (F12)
4. Check Network tab to verify API calls are going to Render backend

### Common Issues & Solutions

#### Issue: "CORS Error" or "Cannot connect to backend"
**Solution:**
- Verify `FRONTEND_URL` is set correctly in Render environment variables
- Check browser Network tab for API URL - should be your Render backend
- Ensure MongoDB Atlas allows connections from anywhere (Network Access settings)

#### Issue: "Cannot find module" errors on Render
**Solution:**
- Push an empty commit: `git commit --allow-empty -m "Trigger Render rebuild"`
- Or: Manually trigger redeploy in Render dashboard under "Deployments"

#### Issue: MongoDB connection fails
**Solution:**
- Verify connection string has no typos
- Confirm MongoDB user is created
- Check IP whitelist includes "0.0.0.0" (allow anywhere)
- Test connection string locally first

#### Issue: Frontend slow or times out
**Solution:**
- Render free tier goes idle after 15 minutes - first request will be slow
- Consider upgrading to paid plan for better performance
- Check Render logs for backend errors

#### Issue: Uploads not persisting
**Solution:**
- Render doesn't persist files in free tier
- Consider using cloud storage (AWS S3, Cloudinary) for uploads
- For now, uploads will be lost on redeploy

### View Deployment Logs

**Render:**
1. Go to Dashboard → Your Web Service
2. Click "Logs" tab to see real-time logs

**Vercel:**
1. Go to Dashboard → Your Project
2. Click "Deployments"
3. Select latest deployment → "Logs"

---

## 6. Final Checklist

- [x] MongoDB Atlas cluster created and running
- [x] MongoDB user created with strong password
- [x] Network Access allows connections
- [x] Backend deployed to Render with all environment variables
- [x] Frontend deployed to Vercel
- [x] Environment variables set on both services
- [x] CORS configured properly
- [x] Backend and frontend URLs updated in both services
- [x] Tested registration and login flows
- [x] Verified API calls work end-to-end

---

## 🚀 Your Production URLs

Once deployed, share these URLs:
- **Frontend:** https://your-vercel-app.vercel.app
- **Backend API:** https://your-render-backend.onrender.com
- **Database:** MongoDB Atlas (private, for backend only)

---

## 📞 Support Resources

- [MongoDB Atlas Documentation](https://docs.mongodb.com/manual/)
- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Node.js Deployment Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**Deployment Status:** Ready for production! 🎉
