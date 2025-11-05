# 🚀 AGI-CAD Deployment Checklist

**Phase 19-FINAL: Production Deploy Guide**

---

## 📋 Pre-Deploy Checklist

### Code Quality
- [ ] All TypeScript errors resolved: `pnpm build`
- [ ] No console errors in browser (development mode)
- [ ] All tests passing (if tests exist)
- [ ] Code committed and pushed to `main` branch

### Functionality Tests
- [ ] Auth working:
  - [ ] Sign in with Google works
  - [ ] Sign out works
  - [ ] Auth state persists on refresh
  - [ ] Tested in incognito mode
  - [ ] Tested in different browser
- [ ] Labs functional:
  - [ ] Plasma Lab runs experiments
  - [ ] Spectral Lab runs experiments
  - [ ] Chemistry Lab runs experiments
  - [ ] Crypto Lab runs experiments
- [ ] Data persistence:
  - [ ] VAULT saves experiments
  - [ ] Experiments visible after refresh
  - [ ] Can load saved experiments
- [ ] Admin dashboard:
  - [ ] Agent traces visible
  - [ ] CVRA suggestions appear
  - [ ] Can approve/reject suggestions
- [ ] Miss Avak responding correctly

---

## 🔧 Vercel Setup

### 1. Connect Repository
- [ ] Project connected to GitHub
- [ ] Auto-deploy on push enabled
- [ ] Production branch: `main`

### 2. Environment Variables

Add these in Vercel dashboard (Settings → Environment Variables):

**Firebase (Required):**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Optional (for agent features):**
```
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
PINECONE_INDEX_NAME=...
```

- [ ] All environment variables added
- [ ] Variables available in Production scope
- [ ] Variables available in Preview scope (optional)

### 3. Build Settings
- [ ] Framework Preset: Next.js
- [ ] Build Command: `pnpm build`
- [ ] Output Directory: `.next`
- [ ] Install Command: `pnpm install`
- [ ] Node.js Version: 18.x or higher

---

## 🔥 Firebase Setup

### 1. Authorized Domains

Go to Firebase Console → Authentication → Settings → Authorized domains

Add:
- [ ] `localhost` (for local dev)
- [ ] Your production domain (e.g., `agi-cad.vercel.app`)
- [ ] `*.vercel.app` (for preview deployments)
- [ ] Any custom domains

### 2. Firestore

**Indexes:**
- [ ] Deploy Firestore indexes (if using firestore.indexes.json)
- [ ] Verify indexes created successfully

**Security Rules:**
- [ ] Review security rules in `firestore.rules`
- [ ] Ensure rules are not too permissive
- [ ] Test rules in Firestore Rules Playground

**Quota:**
- [ ] Firestore in Blaze (pay-as-you-go) plan if expecting high usage
- [ ] Or monitor Spark (free) plan quota

### 3. Storage (if using Firebase Storage)
- [ ] CORS configured for your domain
- [ ] Security rules reviewed

---

## 📊 Monitoring Setup

### 1. Firebase Monitoring
- [ ] Firebase Performance Monitoring enabled (optional)
- [ ] Firebase Crashlytics enabled (optional)

### 2. Vercel Analytics
- [ ] Vercel Analytics enabled
- [ ] Speed Insights enabled

### 3. Error Tracking (Optional)
- [ ] Sentry integrated (if using)
- [ ] Error logs going to Firestore

---

## 🚀 Deploy Process

### 1. Final Checks
```bash
# Clean install
rm -rf node_modules .next
pnpm install

# Build locally
pnpm build

# Check for errors
# Should complete without TypeScript errors
```

### 2. Commit and Push
```bash
git add .
git commit -m "Phase 19-FINAL: Production ready"
git push origin main
```

### 3. Vercel Auto-Deploy
- [ ] Push triggers deploy automatically
- [ ] Watch build logs in Vercel dashboard
- [ ] Build completes successfully
- [ ] Deployment goes live

### 4. Manual Deploy (if needed)
```bash
# Install Vercel CLI
pnpm add -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## ✅ Post-Deploy Checklist

### 1. Smoke Tests

Visit production URL and test:

- [ ] Site loads successfully
- [ ] No console errors
- [ ] Auth: Sign in works
- [ ] Auth: Sign out works
- [ ] Run one experiment in each lab:
  - [ ] Plasma Lab
  - [ ] Spectral Lab
  - [ ] Chemistry Lab
  - [ ] Crypto Lab
- [ ] VAULT saves experiments
- [ ] Miss Avak responds
- [ ] Admin dashboard loads
- [ ] Agent traces visible
- [ ] CVRA suggestions visible

### 2. Verify Data Flow

- [ ] Check Firestore console - data appears
- [ ] Check Authentication tab - users can sign in
- [ ] Check Storage - files uploading (if using)

### 3. Performance Check

- [ ] Page load time < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] No significant layout shifts
- [ ] Mobile responsive

### 4. Cross-Browser Testing

- [ ] Chrome (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

### 5. Security Check

- [ ] HTTPS enabled (Vercel does this automatically)
- [ ] Firebase rules not too permissive
- [ ] API keys not exposed in client code
- [ ] No sensitive data in console logs

---

## 🐛 If Issues Occur

### Deploy Failed

1. **Check build logs in Vercel:**
   - Look for TypeScript errors
   - Check for missing dependencies
   - Verify environment variables

2. **Common issues:**
   - Missing env vars → Add in Vercel dashboard
   - TypeScript errors → Fix locally, commit, push
   - Dependency issues → Update package.json, commit, push

### Site Loads But Auth Fails

1. **Check Firebase authorized domains:**
   - Add production domain
   - Add `*.vercel.app`

2. **Check environment variables:**
   - Verify all Firebase vars set
   - Check for typos
   - Redeploy after changing env vars

### Data Not Saving

1. **Check Firestore rules:**
   - Too restrictive?
   - Authentication required?

2. **Check browser console:**
   - Firebase errors?
   - Network errors?

3. **Check Firestore console:**
   - Data appearing?
   - Rules blocking writes?

### Performance Issues

1. **Check Vercel Analytics:**
   - Identify slow pages
   - Check bundle size

2. **Optimize:**
   - Enable code splitting
   - Lazy load heavy components
   - Optimize images

---

## 🔄 Rollback Plan

If critical issues occur:

### Option 1: Revert Commit
```bash
git revert HEAD
git push origin main
# Vercel will auto-deploy previous version
```

### Option 2: Vercel Dashboard Rollback
1. Go to Vercel dashboard
2. Find previous successful deployment
3. Click "Promote to Production"

### Option 3: Disable Site Temporarily
1. Vercel dashboard → Project Settings
2. Pause deployments
3. Fix issues locally
4. Re-enable when ready

---

## 📞 Support Resources

- **Firebase Console:** https://console.firebase.google.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Next.js Docs:** https://nextjs.org/docs
- **Issue Tracker:** https://github.com/anthropics/claude-code/issues

---

## 🎉 Post-Launch

### 1. Monitor

- [ ] Watch error logs (Firebase + Vercel)
- [ ] Monitor performance metrics
- [ ] Track user signups

### 2. Share

- [ ] Share with beta testers
- [ ] Gather feedback
- [ ] Log feature requests

### 3. Iterate

- [ ] Fix bugs as reported
- [ ] Improve performance
- [ ] Add requested features

---

## 🔐 Security Reminders

- **Never commit:**
  - API keys
  - Service account JSON
  - `.env.local` file

- **Always use:**
  - Environment variables
  - Firestore security rules
  - HTTPS (automatic on Vercel)

- **Regularly check:**
  - Firestore usage/quota
  - Authentication logs
  - Error logs

---

**Last Updated:** Phase 19-FINAL
**Status:** Ready for production deploy 🚀
