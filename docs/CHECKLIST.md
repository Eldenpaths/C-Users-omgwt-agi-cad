# Pre-Deployment Checklist

Before deploying, verify:

## Code Quality
- [ ] `pnpm build` succeeds locally
- [ ] No TypeScript errors
- [ ] All pages load without console errors
- [ ] Auth flow works (login → protected route → logout)

## Configuration
- [ ] vercel.json created
- [ ] .env.example created
- [ ] .gitignore includes .env.local and .vercel
- [ ] All Firebase vars in .env.local

## Testing
- [ ] Can login with Google locally
- [ ] Protected routes redirect to /login
- [ ] Plasma Lab works after auth
- [ ] Spectral Lab works after auth
- [ ] Agent Demo accessible
- [ ] Logout works

## Git
- [ ] All changes committed
- [ ] Pushed to GitHub main branch
- [ ] No sensitive data in repo (.env.local excluded)

## Ready to Deploy? ✅
Follow DEPLOYMENT.md guide!
