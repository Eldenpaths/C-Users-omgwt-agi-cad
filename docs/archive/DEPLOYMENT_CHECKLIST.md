# AGI-CAD Deployment Checklist

## Pre-Deploy

- [ ] Build passes: `npm run build`
- [ ] Type check passes: `npx tsc --noEmit`
- [ ] All tests pass (if any)
- [ ] Environment variables documented
- [ ] Firebase rules deployed
- [ ] Firebase indexes deployed
- [ ] Remove all console.log statements
- [ ] Update version in package.json

## Vercel Environment Variables

### Required (Firebase)
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

### Optional (Enhanced Features)
- [ ] `OPENAI_API_KEY` (for embeddings)
- [ ] `PINECONE_API_KEY` (for vector search)
- [ ] `PINECONE_ENVIRONMENT` (e.g., "us-east-1")
- [ ] `PINECONE_INDEX_NAME` (e.g., "agi-cad-experiments")
- [ ] `GEMINI_API_KEY` (for Gemini features)

## Firebase Setup

- [ ] Production domain added to authorized domains (Firebase Console → Authentication → Settings)
- [ ] `*.vercel.app` added to authorized domains
- [ ] Firestore rules deployed: `firebase deploy --only firestore:rules`
- [ ] Firestore indexes deployed: `firebase deploy --only firestore:indexes`
- [ ] Billing enabled (if using Pinecone, OpenAI, or high traffic)
- [ ] Security rules tested

### Firestore Collections to Create Indexes For
- `learning_sessions`: Index on `userId`, `createdAt` (descending)
- `cvra_suggestions`: Index on `userId`, `createdAt` (descending)
- `telemetry`: Index on `agentId`, `createdAt` (descending)
- `web_vitals`: Index on `url`, `timestamp` (descending)
- `error_logs`: Index on `severity`, `timestamp` (descending)

## Security Headers (Auto-configured via middleware)

- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy: origin-when-cross-origin
- [x] X-XSS-Protection: 1; mode=block
- [x] Strict-Transport-Security (production only)
- [x] Content-Security-Policy

## Post-Deploy Verification

### Basic Functionality
- [ ] Visit production URL
- [ ] Landing page loads (`/launch`)
- [ ] Sign in works
- [ ] Dashboard loads (`/dashboard`)

### Lab Functionality
- [ ] Plasma Lab works
- [ ] Spectral Lab works
- [ ] Chemistry Lab works
- [ ] Crypto Lab works
- [ ] Run experiment in each lab
- [ ] Verify VAULT saves experiments

### Dashboard Functionality
- [ ] Learning Dashboard loads (`/learning/dashboard`)
- [ ] Shows sessions after running experiments
- [ ] CVRA Dashboard loads (`/cognitive/dashboard`)
- [ ] Can run CVRA analysis
- [ ] Simulation Dashboard loads (`/simulation/dashboard`)
- [ ] Can start/stop simulations

### Integrations
- [ ] Learning pipeline works (validate → persist → embed)
- [ ] CVRA can analyze sessions
- [ ] Simulations log telemetry
- [ ] Error logging works
- [ ] Web Vitals tracking works

### Performance
- [ ] Check Lighthouse scores (target: 90+ performance)
- [ ] Check Core Web Vitals in Vercel Analytics
- [ ] Verify lazy loading works
- [ ] Check bundle sizes

### Monitoring
- [ ] Check Vercel deployment logs
- [ ] Check browser console (no errors)
- [ ] Check Firebase logs
- [ ] Monitor error_logs collection
- [ ] Monitor web_vitals collection

## If Issues Occur

### Debugging Steps
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify environment variables in Vercel dashboard
4. Check Firebase authorized domains
5. Review Firestore rules for permission errors
6. Check API route logs in Vercel
7. Verify Firebase indexes are deployed

### Common Issues

**Auth not working**
- Check Firebase authorized domains include your Vercel domain
- Verify Firebase config is correct
- Check browser console for CORS errors

**Firestore permission denied**
- Deploy firestore.rules: `firebase deploy --only firestore:rules`
- Verify user is authenticated
- Check rules allow read/write for authenticated users

**API routes failing**
- Check Vercel function logs
- Verify environment variables are set
- Check for server-side errors in logs

**Missing data in dashboards**
- Check Firestore collections exist
- Verify data is being written (check Firebase console)
- Ensure indexes are deployed

## Rollback Plan

### Option 1: Vercel Dashboard
1. Go to Vercel dashboard
2. Select deployment
3. Click "Redeploy" on previous working deployment

### Option 2: Git Revert
```bash
git log  # Find last working commit
git revert HEAD
git push
```

### Option 3: Quick Fix
```bash
# Make fix
git add .
git commit -m "hotfix: description"
git push
```

## Performance Targets

- **Lighthouse Performance**: 90+
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Time to First Byte (TTFB)**: < 800ms

## Success Criteria

✅ All required environment variables configured
✅ Build passes with 0 errors
✅ All dashboards load successfully
✅ User can sign in and access features
✅ Experiments can be run and saved
✅ No console errors on production
✅ Core Web Vitals meet thresholds
✅ Error logging and monitoring active

## Post-Launch Monitoring

### Daily (First Week)
- [ ] Check error_logs collection for issues
- [ ] Monitor web_vitals for performance regressions
- [ ] Check Vercel Analytics for traffic patterns
- [ ] Review user feedback

### Weekly
- [ ] Review Firestore usage and costs
- [ ] Check API usage (OpenAI, Pinecone)
- [ ] Optimize slow queries
- [ ] Update documentation based on user feedback

### Monthly
- [ ] Review and update dependencies
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Feature usage analysis

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Production URL**: _____________
**Version**: v1.0.0-beta
