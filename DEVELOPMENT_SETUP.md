# 🚀 Complete Development Setup Guide

This guide will help you set up the perfect development environment for the Finaster MLM/DEX project.

## ✅ Installed Tools & Versions

- **Node.js**: v24.11.0
- **npm**: 11.6.1
- **Git**: 2.51.2
- **VS Code**: 1.103.2

## 📦 VS Code Extensions Installed

### AI Assistants
- ✅ **Claude Code** (anthropic.claude-code) - Official Claude CLI
- ✅ **Cline** (saoudrizwan.claude-dev) - Claude Dev in VS Code
- ✅ **Continue** (continue.continue) - AI coding assistant
- ✅ **GitHub Copilot** - AI pair programmer

### Code Quality
- ✅ **ESLint** (dbaeumer.vscode-eslint) - JavaScript/TypeScript linting
- ✅ **Prettier** (esbenp.prettier-vscode) - Code formatter
- ✅ **Error Lens** (usernamehw.errorlens) - Inline error highlighting
- ✅ **Pretty TypeScript Errors** (yoavbls.pretty-ts-errors) - Better TS error messages

### React & TypeScript
- ✅ **ES7+ React Snippets** (dsznajder.es7-react-js-snippets)
- ✅ **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)

### Other
- ✅ **GitLens** (eamodio.gitlens) - Enhanced Git capabilities

## ⚙️ Configuration Files Created

### `.vscode/settings.json`
- Auto-format on save with Prettier
- Auto-fix ESLint errors on save
- TypeScript auto-imports
- Tailwind CSS IntelliSense
- Auto-save on focus change

### `.vscode/launch.json`
- Debug configurations for Vite dev server
- Chrome debugging setup

### `.vscode/extensions.json`
- Recommended extensions list

### `.prettierrc`
- Consistent code formatting rules
- Single quotes, semicolons, 2-space tabs

## 🎯 How to Use AI Assistants

### 1. **Claude Code (Current CLI)**
```bash
# Already running in your terminal
# Continue using it as you are now
```

### 2. **Cline Extension (In VS Code)**
1. Click the Cline icon in the sidebar (or press `Ctrl+Shift+P` → "Cline: Open")
2. Enter your Anthropic API key when prompted
3. Start chatting and editing code directly in VS Code

**Cline Features:**
- Edit files directly in your workspace
- Create new files and folders
- Run terminal commands
- Browse and search files
- Multi-file refactoring

### 3. **Continue Extension**
1. Click Continue icon or press `Ctrl+L`
2. Configure with Claude API key
3. Use inline suggestions and chat

**Continue Features:**
- Inline code completion
- Ask questions about code
- Refactor selections
- Generate tests

### 4. **GitHub Copilot**
- Already active!
- Type comments to get code suggestions
- Press `Tab` to accept suggestions

## 🔧 Development Workflow

### Starting Development
```bash
cd C:\Projects\asterdex-8621-main
npm run dev
```
Server runs on: http://localhost:5176

### Useful Commands
```bash
# Install new package
npm install package-name

# Run type checking
npx tsc --noEmit

# Run ESLint
npm run lint

# Format all files
npx prettier --write .

# Check for security vulnerabilities
npm audit

# Fix security issues
npm audit fix
```

### VS Code Shortcuts
- `Ctrl+Shift+P` - Command Palette
- `Ctrl+P` - Quick file open
- `Ctrl+B` - Toggle sidebar
- `Ctrl+J` - Toggle terminal
- `Ctrl+` ` - Toggle terminal
- `Ctrl+Shift+F` - Search in all files
- `Alt+Shift+F` - Format document
- `F2` - Rename symbol

## 📁 Project Structure

```
asterdex-8621-main/
├── app/
│   ├── pages/
│   │   ├── user/          # User pages (Dashboard, Wallet, etc.)
│   │   ├── admin/         # Admin pages (User Mgmt, KYC, etc.)
│   │   └── auth/          # Login, Register
│   ├── components/        # Reusable components
│   ├── services/          # API services (Supabase)
│   ├── styles/            # CSS files
│   └── main.tsx           # App entry point & router
├── public/
│   └── config.js          # Runtime configuration
├── .env                   # Environment variables
└── package.json           # Dependencies
```

## 🗄️ Database (Supabase)

**Project URL**: https://dsgtyrwtlpnckvcozfbc.supabase.co

### Accessing Supabase
1. Go to https://supabase.com
2. Sign in to your account
3. Select project: dsgtyrwtlpnckvcozfbc
4. Use SQL Editor for queries
5. Use Table Editor for data management

### Test Accounts
- **Admin**: admin@asterdex.com
- **User**: user@asterdex.com

## 🎨 Styling

This project uses:
- **Tailwind CSS** - Utility-first CSS framework
- **CSS Variables** - For theming
- Tailwind IntelliSense for auto-completion

## 🐛 Debugging

### In VS Code
1. Press `F5` or click Run → Start Debugging
2. Choose "Launch Chrome" or "Debug Vite Dev Server"
3. Set breakpoints by clicking left of line numbers

### Browser DevTools
- Press `F12` in Chrome
- Use React DevTools extension
- Check Network tab for API calls
- Use Console for logs

## 📝 Code Quality Tools

### ESLint (Linting)
- Automatically checks code for errors
- Fixes on save when possible
- Red squiggly lines show errors

### Prettier (Formatting)
- Auto-formats on save
- Consistent code style across team
- Run manually: `Shift+Alt+F`

### TypeScript
- Type checking at compile time
- IntelliSense for auto-completion
- Hover over code to see types

## 🚨 Common Issues & Solutions

### Port Already in Use
```bash
# Vite automatically finds next available port
# Default: 5176 (or 5177, 5178, etc.)
```

### Module Not Found
```bash
npm install
npm run dev
```

### TypeScript Errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Git Issues
```bash
# Discard local changes
git restore .

# Pull latest
git pull origin main
```

## 🔗 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vite Docs**: https://vitejs.dev
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com
- **TypeScript**: https://www.typescriptlang.org

## 💡 Pro Tips

1. **Use Snippets**: Type `rafce` for React component template
2. **Multi-cursor**: `Alt+Click` to add cursors
3. **Duplicate Line**: `Shift+Alt+Down`
4. **Move Line**: `Alt+Up/Down`
5. **Comment Toggle**: `Ctrl+/`
6. **Search Symbol**: `Ctrl+T`
7. **Go to Definition**: `F12`
8. **Find References**: `Shift+F12`

## 🎯 Next Steps

1. ✅ All routes and pages created (no more 404 errors!)
2. 🔄 Connect pages to Supabase backend
3. 🔄 Implement real data fetching
4. 🔄 Add form validation
5. 🔄 Implement wallet transactions
6. 🔄 Build referral system
7. 🔄 Complete KYC workflow

## 🤝 Getting Help

- Use **Cline** or **Claude Code** for code questions
- Check console for error messages
- Use VS Code's "Problems" panel (`Ctrl+Shift+M`)
- Search error messages online

---

**Happy Coding! 🚀**

For AI assistance, you now have **4 powerful tools**:
1. Claude Code (CLI) - Current session
2. Cline (VS Code sidebar) - Best for file operations
3. Continue (Inline) - Best for quick suggestions
4. GitHub Copilot - Best for code completion
