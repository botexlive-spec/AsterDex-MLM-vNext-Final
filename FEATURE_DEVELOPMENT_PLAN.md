# Asterdex Feature Development Plan
## Admin/User Login & Referral Marketing System

---

## 📋 Current System Analysis

### **Existing Authentication:**
- ✓ Privy wallet authentication (email, Google, Web3 wallets)
- ✓ WalletConnect integration
- ✓ Orderly Network broker authentication
- ✓ Basic affiliate tracking (rewards/affiliate page)

### **What We'll Add:**
1. **Traditional Admin/User Login System**
   - Email/password authentication
   - Admin dashboard
   - User management
   - Role-based access control (Admin, User, Trader)

2. **Enhanced Referral Marketing System**
   - Unique referral codes
   - Multi-level referral tracking
   - Rewards dashboard
   - Commission calculation
   - Analytics and reporting

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  ASTERDEX DEX APPLICATION                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐      ┌──────────────────┐        │
│  │  Wallet Auth     │      │  Admin/User Auth │        │
│  │  (Privy)         │      │  (Supabase)      │        │
│  │                  │      │                  │        │
│  │  - Web3 Wallets  │      │  - Email/Pass    │        │
│  │  - Email Login   │      │  - Admin Panel   │        │
│  │  - Google OAuth  │      │  - User Mgmt     │        │
│  └──────────────────┘      └──────────────────┘        │
│           │                         │                    │
│           └─────────┬──────────────┘                    │
│                     │                                    │
│            ┌────────▼────────┐                          │
│            │  Unified User    │                          │
│            │  Management      │                          │
│            └────────┬────────┘                          │
│                     │                                    │
│       ┌─────────────┴─────────────┐                     │
│       │                           │                     │
│  ┌────▼────┐              ┌──────▼──────┐             │
│  │ Trading │              │  Referral   │             │
│  │ System  │              │  Marketing  │             │
│  │         │              │  System     │             │
│  │ -Orders │              │ -Codes      │             │
│  │ -Charts │              │ -Tracking   │             │
│  │ -Markets│              │ -Rewards    │             │
│  └─────────┘              └─────────────┘             │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema (Supabase)

### **1. Users Table**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user', -- 'admin', 'user', 'trader'
  wallet_address TEXT,
  privy_id TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **2. Referral Codes Table**
```sql
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  clicks INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
```

### **3. Referrals Table**
```sql
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id),
  referee_id UUID REFERENCES users(id),
  referral_code TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed'
  commission_earned DECIMAL(18,6) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **4. Trading Activity Table**
```sql
CREATE TABLE trading_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  trade_volume DECIMAL(18,6),
  commission DECIMAL(18,6),
  referrer_commission DECIMAL(18,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **5. Admin Actions Log**
```sql
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📂 Project Structure (New Files)

```
app/
├── pages/
│   ├── admin/
│   │   ├── Dashboard.tsx          # Admin main dashboard
│   │   ├── Users.tsx               # User management
│   │   ├── Referrals.tsx           # Referral analytics
│   │   ├── Settings.tsx            # Admin settings
│   │   └── Login.tsx               # Admin login page
│   │
│   ├── auth/
│   │   ├── Login.tsx               # User login
│   │   ├── Register.tsx            # User registration
│   │   ├── ForgotPassword.tsx      # Password reset
│   │   └── VerifyEmail.tsx         # Email verification
│   │
│   └── referrals/
│       ├── Dashboard.tsx           # User referral dashboard
│       ├── Generate.tsx            # Generate referral codes
│       └── Analytics.tsx           # Referral analytics
│
├── components/
│   ├── auth/
│   │   ├── ProtectedRoute.tsx      # Route protection
│   │   ├── AdminRoute.tsx          # Admin-only routes
│   │   └── AuthGuard.tsx           # Auth checking
│   │
│   ├── admin/
│   │   ├── UserTable.tsx           # User list table
│   │   ├── StatsCard.tsx           # Statistics cards
│   │   └── ActionLog.tsx           # Activity log
│   │
│   └── referral/
│       ├── ReferralCard.tsx        # Referral code card
│       ├── ReferralStats.tsx       # Statistics display
│       └── CommissionChart.tsx     # Earnings chart
│
├── hooks/
│   ├── useAuth.ts                  # Authentication hook
│   ├── useAdmin.ts                 # Admin operations hook
│   └── useReferral.ts              # Referral operations hook
│
├── services/
│   ├── auth.service.ts             # Auth API calls
│   ├── admin.service.ts            # Admin API calls
│   ├── referral.service.ts         # Referral API calls
│   └── supabase.client.ts          # Supabase client
│
├── types/
│   ├── auth.types.ts               # Auth type definitions
│   ├── admin.types.ts              # Admin type definitions
│   └── referral.types.ts           # Referral type definitions
│
└── utils/
    ├── auth.utils.ts               # Auth helpers
    ├── permissions.ts              # Permission checks
    └── referral.utils.ts           # Referral helpers
```

---

## 🔧 Required Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "@tanstack/react-query": "^5.17.0",
    "recharts": "^2.10.3",
    "date-fns": "^3.0.6"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5"
  }
}
```

---

## 🚀 Implementation Steps

### **Phase 1: Backend Setup (Supabase)**
1. Create Supabase project
2. Set up database tables
3. Configure Row Level Security (RLS)
4. Create database functions
5. Set up authentication policies

### **Phase 2: Authentication System**
1. Create login/register pages
2. Implement JWT token management
3. Build protected routes
4. Add admin role checking
5. Create password reset flow

### **Phase 3: Admin Dashboard**
1. Build admin layout
2. Create user management interface
3. Implement user CRUD operations
4. Add activity logging
5. Build analytics dashboard

### **Phase 4: Referral System**
1. Generate unique referral codes
2. Track referral clicks/signups
3. Calculate commissions
4. Build referral dashboard
5. Add analytics and reporting

### **Phase 5: Integration**
1. Connect with existing wallet auth
2. Sync user data
3. Add referral tracking to trades
4. Implement commission payouts
5. Testing and debugging

---

## 🎨 UI/UX Features

### **Admin Dashboard**
- User statistics overview
- Recent activity feed
- User management table
- Referral analytics
- Revenue reports
- System settings

### **User Referral Dashboard**
- Personal referral code
- Click/signup statistics
- Earnings tracker
- Commission history
- Social sharing buttons
- Referral leaderboard

### **Login/Register**
- Modern form design
- Social OAuth options
- Two-factor authentication (optional)
- Remember me functionality
- Password strength meter

---

## 🔒 Security Features

1. **Password Security**
   - Bcrypt hashing
   - Minimum 8 characters
   - Complexity requirements

2. **JWT Tokens**
   - Secure token generation
   - Refresh token mechanism
   - Token expiration

3. **Row Level Security**
   - User data isolation
   - Admin-only access
   - Audit logging

4. **Rate Limiting**
   - Login attempt limits
   - API call throttling
   - Brute force protection

---

## 📊 Analytics & Reporting

### **Admin Analytics**
- Total users
- Active traders
- Total trading volume
- Referral conversion rates
- Commission payouts
- User growth charts

### **User Analytics**
- Personal referrals
- Conversion rates
- Earnings over time
- Top performing codes
- Geographic distribution

---

## 🧪 Testing Strategy

1. **Unit Tests**
   - Auth functions
   - Permission checks
   - Referral calculations

2. **Integration Tests**
   - Login/register flow
   - Referral tracking
   - Commission payouts

3. **E2E Tests**
   - Complete user journey
   - Admin workflows
   - Referral process

---

## 📝 Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_KEY=your_service_key

# JWT
VITE_JWT_SECRET=your_jwt_secret
VITE_JWT_EXPIRY=7d

# Admin
VITE_ADMIN_EMAIL=admin@asterdex.com

# Referral
VITE_REFERRAL_COMMISSION_RATE=0.1
VITE_REFERRAL_CODE_LENGTH=8
```

---

## 🎯 Success Metrics

1. **User Adoption**
   - 100+ users in first month
   - 20% referral signup rate

2. **Trading Activity**
   - Track referred user trades
   - Calculate referral value

3. **System Performance**
   - <100ms auth response
   - 99.9% uptime

---

## 📚 Next Steps

### **Immediate Actions:**
1. ✅ Install required dependencies
2. ✅ Set up Supabase project
3. ✅ Create database schema
4. ✅ Build authentication pages
5. ✅ Implement admin dashboard
6. ✅ Build referral system

### **Ready to Start?**
Choose which phase you want to start with:
- **A**: Backend & Database Setup
- **B**: Authentication System
- **C**: Admin Dashboard
- **D**: Referral Marketing System
- **E**: Full Implementation (All phases)

---

**Let me know which phase you'd like to begin with, and I'll start the implementation!** 🚀
