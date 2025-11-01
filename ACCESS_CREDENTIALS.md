# 🔑 Access Credentials & Setup Guide

## Complete Setup & Login Information

---

## ✅ What's Ready

### **Authentication Pages Created:**
- ✅ Login Page (`app/pages/auth/Login.tsx`)
- ✅ Register Page (`app/pages/auth/Register.tsx`)
- ✅ Protected Route Component (`app/components/auth/ProtectedRoute.tsx`)

### **Database Scripts Created:**
- ✅ `database-schema.sql` (Base schema)
- ✅ `database-mlm-schema.sql` (MLM extensions)
- ✅ `DATABASE_SETUP_WITH_ADMIN.sql` (Complete setup with users)

---

## 🚀 Quick Setup (15 Minutes)

### Step 1: Set Up Supabase Database

1. **Go to:** https://app.supabase.com
2. **Click:** "New Project"
3. **Fill in:**
   - Project Name: `asterdex-mlm`
   - Database Password: (create strong password, save it!)
   - Region: Choose closest to you
4. **Click:** "Create new project" (takes ~2 minutes)

---

### Step 2: Run Database Scripts

Once project is ready:

1. **Go to:** SQL Editor (left sidebar)
2. **Click:** "New Query"
3. **Run these scripts in order:**

#### Script 1: Base Schema (1-2 minutes)
```sql
-- Copy entire contents from database-schema.sql
-- Paste and click "Run" (Ctrl+Enter)
```

#### Script 2: MLM Extensions (1-2 minutes)
```sql
-- Copy entire contents from database-mlm-schema.sql
-- Paste and click "Run" (Ctrl+Enter)
```

#### Script 3: Create Admin User (30 seconds)
```sql
-- Copy entire contents from DATABASE_SETUP_WITH_ADMIN.sql
-- Paste and click "Run" (Ctrl+Enter)
```

**✅ You should see:** "Success. No rows returned" or a table showing created users

---

### Step 3: Get Your API Keys

1. **Go to:** Settings → API (left sidebar)
2. **Copy these values:**
   - Project URL (example: `https://xxxxx.supabase.co`)
   - Anon/Public Key (starts with `eyJhbGc...`)

---

### Step 4: Configure Environment

Create `.env` file in project root:

```bash
# Copy from .env.example
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# JWT Secret (generate random 32 characters)
VITE_JWT_SECRET=your_random_32_character_secret_here

# Other settings (already configured)
VITE_REFERRAL_COMMISSION_RATE=0.1
VITE_ROBOT_SUBSCRIPTION_PRICE=100
```

**Generate JWT Secret:**
```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

### Step 5: Add Login Route to Your App

Update your routing file (e.g., `app/App.tsx` or `app/main.tsx`):

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/user/Dashboard';
import { ProtectedRoute, AdminRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🔐 Login Credentials

### **Admin Access:**
```
URL:      http://localhost:5173/login
Email:    admin@asterdex.com
Password: admin123
Role:     admin
```

**After login redirects to:** `/admin/dashboard`

**Admin Privileges:**
- ✅ Full system access
- ✅ User management
- ✅ Financial approvals
- ✅ KYC review
- ✅ System settings
- ✅ All reports

---

### **Test User Access:**
```
URL:      http://localhost:5173/login
Email:    user@asterdex.com
Password: user123
Role:     user
```

**After login redirects to:** `/dashboard`

**User Access:**
- ✅ Personal dashboard
- ✅ Investment packages
- ✅ Robot subscription
- ✅ Referral system
- ✅ Wallet management
- ✅ DEX trading

---

### **Both Accounts Include:**
- ✅ $1,000 starting balance (for testing)
- ✅ Email verified (no verification needed)
- ✅ Active account
- ✅ Welcome notification

---

## 🎯 Login Page Features

### Quick Login Buttons (Development Mode)
The login page includes quick-login buttons that auto-fill credentials:
- **👨‍💼 Admin** button → Fills admin credentials
- **👤 User** button → Fills user credentials

Just click the button and then click "Sign In"!

---

## 📱 Test the Login Flow

### Method 1: Quick Test
1. Start dev server: `npm run dev`
2. Go to: http://localhost:5173/login
3. Click "👨‍💼 Admin" quick login button
4. Click "Sign In"
5. You should be redirected to admin dashboard

### Method 2: Manual Entry
1. Go to: http://localhost:5173/login
2. Enter:
   - Email: `admin@asterdex.com`
   - Password: `admin123`
3. Click "Sign In"
4. Should redirect to `/admin/dashboard`

---

## 🔍 Verify Database Setup

Run this in Supabase SQL Editor to verify everything is set up:

```sql
-- Check users
SELECT email, role, wallet_balance, email_verified
FROM public.users;

-- Should show:
-- admin@asterdex.com | admin | 1000 | true
-- user@asterdex.com  | user  | 1000 | true

-- Check packages
SELECT name, min_amount, max_amount, roi_percentage_min
FROM public.packages
WHERE is_active = true;

-- Should show 3 packages:
-- Starter Package  | 100   | 2000  | 5
-- Growth Package   | 2001  | 5000  | 7
-- Premium Package  | 5001  | null  | 10

-- Check system settings
SELECT setting_key, setting_value
FROM public.system_settings;

-- Should show all configured settings
```

---

## 🎨 Login Page Preview

### Features:
- ✅ Beautiful gradient design
- ✅ Email/password authentication
- ✅ Remember me checkbox
- ✅ Forgot password link
- ✅ Quick login buttons (dev mode)
- ✅ Register link
- ✅ Info panel with features
- ✅ Test credentials display
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states

---

## 🔄 After Login

### Admin User Flow:
```
Login → /admin/dashboard
└─ Access to:
   ├─ User Management
   ├─ Package Management
   ├─ Financial Controls
   ├─ KYC Reviews
   ├─ MLM Tree Explorer
   ├─ Reports & Analytics
   └─ System Settings
```

### Regular User Flow:
```
Login → /dashboard
└─ Access to:
   ├─ Dashboard Overview
   ├─ My Business (Team, Tree)
   ├─ Investments (Packages)
   ├─ Robot Subscription
   ├─ Wallet (Deposit, Withdraw)
   ├─ DEX Trading
   ├─ Ranks & Rewards
   ├─ KYC Verification
   └─ Profile Settings
```

---

## 🚨 Troubleshooting

### Issue: "Failed to fetch" on login
**Solution:**
1. Check `.env` has correct Supabase URL and key
2. Verify database scripts ran successfully
3. Check browser console for errors

### Issue: "User not found"
**Solution:**
1. Run `DATABASE_SETUP_WITH_ADMIN.sql` again
2. Verify users exist in Supabase → Authentication → Users
3. Check public.users table has entries

### Issue: Redirects to login after authentication
**Solution:**
1. Check if token is stored (check localStorage in DevTools)
2. Verify `getCurrentUser()` function works
3. Check RLS policies allow user access

### Issue: Admin redirected to user dashboard
**Solution:**
1. Verify role in database: `SELECT role FROM public.users WHERE email = 'admin@asterdex.com'`
2. Should return 'admin'
3. If not, run: `UPDATE public.users SET role = 'admin' WHERE email = 'admin@asterdex.com'`

---

## 🎉 You're Ready!

### What Works Now:
✅ Complete authentication system
✅ Admin and user login
✅ Role-based access control
✅ Protected routes
✅ Session management
✅ Database with test data
✅ $1000 starting balance for both users

### Next Steps:
1. Test login with both accounts
2. Start building additional dashboard pages
3. Integrate existing components
4. Add more features

---

## 📞 Quick Reference

### **Access URLs:**
- Login: http://localhost:5173/login
- Register: http://localhost:5173/register
- User Dashboard: http://localhost:5173/dashboard
- Admin Dashboard: http://localhost:5173/admin/dashboard

### **Admin Credentials:**
- Email: admin@asterdex.com
- Password: admin123

### **User Credentials:**
- Email: user@asterdex.com
- Password: user123

### **Database:**
- Supabase Dashboard: https://app.supabase.com

### **Files:**
- Login Page: `app/pages/auth/Login.tsx`
- Register Page: `app/pages/auth/Register.tsx`
- Protected Route: `app/components/auth/ProtectedRoute.tsx`
- Auth Service: `app/services/auth.service.ts`

---

## 🎊 Success!

Your complete MLM + DEX authentication system is ready!

**You can now:**
1. ✅ Login as admin or user
2. ✅ Access role-based dashboards
3. ✅ Test the authentication flow
4. ✅ Start building additional features

**Happy coding! 🚀**
