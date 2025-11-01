# ⚡ Quick Start Guide

## 🎯 Open Project in VS Code

```bash
cd C:\Projects\asterdex-8621-main
code .
```

## 🚀 Start Development Server

In VS Code terminal (`` Ctrl+` ``):
```bash
npm run dev
```

Visit: **http://localhost:5176**

## 🔑 Login

**Admin Account:**
- Email: `admin@asterdex.com`
- Password: (your admin password)

**User Account:**
- Email: `user@asterdex.com`
- Password: (your user password)

## 📱 Available Routes (No 404 Errors!)

### User Pages
- `/dashboard` - Main dashboard
- `/packages` - Investment packages
- `/robot` - Robot subscription
- `/wallet` - Wallet overview
- `/wallet/deposit` - Deposit funds
- `/wallet/withdraw` - Withdraw funds
- `/team` - Team management
- `/referrals` - Referral system
- `/transactions` - Transaction history
- `/profile` - User profile
- `/settings` - User settings
- `/reports` - Performance reports
- `/ranks` - Rank progression
- `/earnings` - Earnings breakdown
- `/genealogy` - Team tree
- `/kyc` - KYC verification

### Admin Pages (admin@asterdex.com only)
- `/admin/users` - User management
- `/admin/kyc` - KYC approvals
- `/admin/packages` - Package management
- `/admin/financial` - Financial management
- `/admin/reports` - Admin reports
- `/admin/settings` - Platform settings

## 🤖 Using AI Assistants

### Option 1: Cline (In VS Code Sidebar)
1. Look for **Cline** icon in left sidebar
2. Click it to open chat
3. Enter Anthropic API key if prompted
4. Start chatting!

**What Cline Can Do:**
- Edit files directly
- Create new components
- Refactor code
- Run commands
- Search codebase

### Option 2: Continue (Inline AI)
1. Press `Ctrl+L` to open Continue chat
2. Or select code → Right-click → Continue options
3. Ask questions or request changes

### Option 3: GitHub Copilot (Auto-suggestions)
- Already active!
- Just start typing - suggestions appear automatically
- Press `Tab` to accept

### Option 4: Claude Code CLI
- Keep using the current terminal session
- Works alongside VS Code

## 🎨 Code Formatting

Files auto-format when you save! (`Ctrl+S`)

Manual format: `Shift+Alt+F`

## 🔍 Useful VS Code Shortcuts

| Action | Shortcut |
|--------|----------|
| Command Palette | `Ctrl+Shift+P` |
| Quick Open File | `Ctrl+P` |
| Toggle Terminal | `` Ctrl+` `` |
| Toggle Sidebar | `Ctrl+B` |
| Find in Files | `Ctrl+Shift+F` |
| Go to Definition | `F12` |
| Format Document | `Shift+Alt+F` |
| Multi-Cursor | `Alt+Click` |
| Duplicate Line | `Shift+Alt+Down` |
| Comment Toggle | `Ctrl+/` |

## 📦 Installing New Packages

```bash
npm install package-name
```

Example:
```bash
npm install axios
npm install -D @types/axios
```

## 🐛 If Something Goes Wrong

### Server Won't Start
```bash
# Kill old processes and restart
npm run dev
```

### Type Errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Port Already in Use
- Vite will automatically use next available port (5177, 5178, etc.)

### Clear Cache
```bash
# Delete cache and restart
rm -rf node_modules/.vite
npm run dev
```

## 📚 Full Documentation

See `DEVELOPMENT_SETUP.md` for complete setup guide!

## 🎯 What's Next?

All UI pages are ready! Now you can:

1. **Test all routes** - Click around and verify everything works
2. **Connect to backend** - Implement real data from Supabase
3. **Add features** - Build out the actual functionality
4. **Customize UI** - Adjust colors, layouts, text

---

**Ready to code! 🚀**
