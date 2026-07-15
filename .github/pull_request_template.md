## 📋 Pull Request Summary

<!-- Provide a brief description of what this PR does -->

## 🔗 Related Issue

Closes #<!-- Issue number -->

## 🔄 Type of Change

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that changes existing functionality)
- [ ] 🗄️ Database migration (schema changes)
- [ ] 🎨 UI/UX improvement
- [ ] 🔧 Configuration change
- [ ] 📝 Documentation update
- [ ] 🧹 Refactor / cleanup

## 📸 Screenshots / Recordings

<!-- For UI changes, add before/after screenshots or a screen recording -->

## ✅ Pre-merge Checklist

### Code Quality
- [ ] Code follows the project's coding style
- [ ] Self-reviewed the diff
- [ ] No unnecessary `console.log` statements
- [ ] No TypeScript `any` types without justification
- [ ] Imports are clean (no unused imports)

### Testing
- [ ] Tested locally with `npm run dev`
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)

### Database (if applicable)
- [ ] Migration file named correctly (`YYYYMMDDHHMMSS_description.sql`)
- [ ] Migration is idempotent (safe to re-run)
- [ ] RLS policies are applied to new tables
- [ ] Existing data is not broken by schema changes

### AI Features (if applicable)
- [ ] Tested with real Gemini API key
- [ ] Fallback/demo mode still works
- [ ] Key rotation works correctly

## 🔒 Security Checklist

- [ ] No API keys or secrets committed
- [ ] User input is validated/sanitized
- [ ] RLS policies enforce correct access control

## 📝 Notes for Reviewers

<!-- Any additional context, caveats, or things to pay attention to -->
