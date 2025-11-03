# AGI-CAD Deployment Guide

## Prerequisites
- GitHub repo pushed to main branch
- Vercel account (free tier works)
- Firebase credentials ready

## Step 1: Build Test
```bash
pnpm build  # Must succeed!
```

## Step 2: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

## Step 3: Deploy to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework Preset: **Next.js** (should auto-detect)
4. Root Directory: `./`
5. Build Command: `pnpm build` (default)
6. Install Command: `pnpm install` (default)

## Step 4: Environment Variables
In Vercel dashboard:
- Settings → Environment Variables
- Add all 6 Firebase variables from .env.local
- Apply to: Production, Preview, Development

Firebase Environment Variables Needed:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

## Step 5: Deploy!
Click **Deploy** button

Your site will be live at:
`https://agi-cad-science-labs.vercel.app`

Or custom domain if configured.

## Step 6: Verify Deployment
Test these URLs:
- `/` - Homepage
- `/login` - Auth page
- `/labs` - Protected route (should redirect if not logged in)
- `/plasma-lab` - Lab should work
- `/api/labs/command` - API route

## Common Issues
- **Build fails**: Run `pnpm build` locally first
- **Auth not working**: Check Firebase env vars in Vercel
- **404 errors**: Check vercel.json rewrites
- **API broken**: Ensure environment variables are set

## Post-Deployment
1. Add production domain to Firebase Auth:
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add: `agi-cad-science-labs.vercel.app` (or your custom domain)

2. Update Firestore rules if needed
3. Test Google Sign-In on live site
