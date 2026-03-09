# Vercel Deployment Guide

## Quick Deploy Steps

### 1. Install Vercel CLI (Optional but Recommended)
```bash
npm install -g vercel
```

### 2. Deploy to Vercel

**Option A: Using Git (Recommended)**
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```
Then:
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New Project"
4. Select your repository
5. Click "Import"

**Option B: Using Vercel CLI**
```bash
vercel
```
Follow the prompts to deploy.

### 3. Configure Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add your Firebase credentials:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

💡 **Find these values in:**
- Firebase Console → Your Project → Project Settings → General Tab

### 4. Deploy Production Build

Once environment variables are set:
```bash
vercel --prod
```

Or redeploy from the Web UI:
- Push to main branch → Auto-deploys to production

## Firestore Security Rules Setup

After deployment, make sure to:
1. Update Firestore CORS settings if needed
2. Update authentication allowed domains to include your Vercel URL
3. Test the deployment and verify Firestore operations work

## Monitoring

After deployment:
1. Check **Deployments** tab for build status
2. Monitor **Analytics** for performance
3. Check **Logs** for any errors

## Updates

To update your live app:
```bash
# Make changes locally
git add .
git commit -m "Update message"
git push origin main

# Vercel auto-deploys on push
# Or manually deploy:
vercel --prod
```

## Troubleshooting

**Build fails?**
- Check build logs: `vercel logs <deployment-url>`
- Ensure all environment variables are set
- Verify `package.json` scripts are correct

**Firebase not working?**
- Verify environment variables in Vercel dashboard
- Check Firestore Security Rules allow your domain
- Enable CORS in Firebase settings

**Deployment too slow?**
- Check for large dependencies
- Optimize images and assets
- Use Vercel's analytics to identify bottlenecks
