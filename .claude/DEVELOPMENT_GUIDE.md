# AsterDex MLM vNext - Development Guide

## Project Overview

**Repository**: https://github.com/botexlive-spec/asterdex-trading-platform.git
**Base Commit**: 671ec1d
**Setup Date**: 2025-11-12
**Current Phase**: Initial Setup Complete (15%)

## Technology Stack

### Frontend
- **Framework**: React 18.3 + TypeScript 5.8
- **Build Tool**: Vite 7.1
- **Styling**: Tailwind CSS
- **State Management**: React Context + TanStack Query
- **Routing**: React Router DOM 7.1
- **UI Library**: Orderly Network UI Components

### Backend
- **Runtime**: Node.js 22.12
- **Framework**: Express.js 5.1
- **Database**: MySQL 8.4
- **Authentication**: JWT (jsonwebtoken 9.0)
- **Task Scheduling**: node-cron 4.2
- **ORM**: Raw SQL with mysql2 connection pooling

### Development Tools
- **Package Manager**: npm
- **Type Checking**: TypeScript
- **Linting**: ESLint
- **Concurrency**: concurrently (for running multiple servers)

## Quick Start Commands

```bash
# Install dependencies
npm install

# Start both servers (recommended)
npm run dev:all

# Start frontend only
npm run dev

# Start backend only
npm run dev:server

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Server Ports

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## Database Configuration

**MySQL 8.4 Configuration** (from `.env`):
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=finaster_mlm
MYSQL_USER=root
MYSQL_PASSWORD=root
```

## Admin Menus (15 Core Pages)

| Menu | File | Service | Key Features |
|------|------|---------|--------------|
| Dashboard | `app/pages/admin/Dashboard.tsx` | `admin-dashboard.service.ts` | User stats, Financial overview, Activity logs |
| User Management | `app/pages/admin/UserManagement.tsx` | `admin-user.service.ts` | CRUD operations, Search, Status management |
| KYC Management | `app/pages/admin/KYCManagement.tsx` | `admin-kyc.service.ts` | Verification, Document review, Approval workflow |
| Package Management | `app/pages/admin/PackageManagement.tsx` | `admin-package.service.ts` | Package CRUD, Pricing, ROI configuration |
| Commission Management | `app/pages/admin/CommissionManagement.tsx` | `admin-commission.service.ts` | 30-level commission config, Rate management |
| Binary Management | `app/pages/admin/BinaryManagement.tsx` | `admin-binary.service.ts` | Binary tree view, Matching bonus config |
| Financial Management | `app/pages/admin/FinancialManagement.tsx` | `admin-financial.service.ts` | Deposits, Withdrawals, Transaction approval |
| Reports | `app/pages/admin/ReportsAdmin.tsx` | `admin-reports.service.ts` | 10+ report types, Export, Analytics |
| Communications | `app/pages/admin/CommunicationsAdmin.tsx` | `admin-communications.service.ts` | Email, SMS, Push notifications |
| Support Management | `app/pages/admin/SupportManagement.tsx` | `admin-support.service.ts` | Ticket management, Response system |
| Audit Logs | `app/pages/admin/AuditLogs.tsx` | `admin-audit.service.ts` | Activity logging, Security audit |
| System Configuration | `app/pages/admin/SystemConfiguration.tsx` | `admin-config.service.ts` | System settings, Feature toggles |
| Rank Management | `app/pages/admin/RankManagement.tsx` | `admin-rank.service.ts` | 7-tier rank system, Criteria management |
| Plan Settings | `app/pages/admin/PlanSettings.tsx` | `planSettings.ts` | MLM plan configuration |
| Income Simulator | `app/pages/admin/IncomeSimulator.tsx` | - | Income projection, Simulation tools |

## User Menus (13 Core Pages)

| Menu | File | Service | Key Features |
|------|------|---------|--------------|
| Dashboard | `app/pages/user/Dashboard.tsx` | `dashboard.ts` | Overview, Stats, Quick actions |
| Profile | `app/pages/user/Profile.tsx` | `auth.service.ts` | Profile editing, Password change |
| KYC Verification | `app/pages/user/KYC.tsx` | `kyc.service.ts` | Document upload, Verification status |
| Packages | `app/pages/user/Packages.tsx` | `package.service.ts` | Package purchase, Active packages |
| Earnings | `app/pages/user/EarningsNew.tsx` | `transactions.ts` | Earnings breakdown, Transaction history |
| Genealogy | `app/pages/user/GenealogyNew.tsx` | `genealogy.service.ts` | Binary tree view, Unilevel view |
| Referrals | `app/pages/user/ReferralsNew.tsx` | `referral.service.ts` | Referral link, Direct referrals list |
| Wallet | `app/pages/user/Wallet.tsx` | `wallet.service.ts` | Balance, Deposit, Withdrawal |
| Deposit | `app/pages/user/Deposit.tsx` | `wallet.service.ts` | Deposit request, Payment methods |
| Reports | `app/pages/user/Reports.tsx` | `reports.ts` | Income reports, Team reports |
| Robot/Trading Bot | `app/pages/user/Robot.tsx` | - | Bot subscription, Performance |
| Ranks | `app/pages/user/Ranks.tsx` | `ranks.ts` | Current rank, Progression |
| Settings | `app/pages/user/Settings.tsx` | `admin-config.service.ts` | Preferences, Notifications |

## Backend Services (30+ Service Files)

### Admin Services
- `admin.service.ts` - Core admin operations
- `admin-audit.service.ts` - Audit logging
- `admin-binary.service.ts` - Binary tree management
- `admin-commission.service.ts` - Commission configuration
- `admin-communications.service.ts` - Communications
- `admin-config.service.ts` - System configuration
- `admin-dashboard.service.ts` - Dashboard data
- `admin-financial.service.ts` - Financial operations
- `admin-impersonate.service.ts` - User impersonation
- `admin-kyc.service.ts` - KYC management
- `admin-package.service.ts` - Package management
- `admin-rank.service.ts` - Rank management
- `admin-reports.service.ts` - Report generation
- `admin-support.service.ts` - Support tickets
- `admin-user.service.ts` - User management

### User Services
- `auth.service.ts` - Authentication
- `wallet.service.ts` - Wallet operations
- `package.service.ts` - Package purchases
- `team.service.ts` - Team operations
- `genealogy.service.ts` - Genealogy tree
- `kyc.service.ts` - KYC submissions
- `referral.service.ts` - Referral system
- `mlm-client.ts` - MLM operations
- `team-report.service.ts` - Team reporting

## Core MLM Features

### 30-Level Commission System
- Configurable commission rates per level
- Automatic upline distribution
- Real-time calculation

### Binary Tree Structure
- Left/right leg tracking
- Volume calculation
- 6-tier matching bonus system

### Rank Advancement (7 Tiers)
1. Starter
2. Bronze
3. Silver
4. Gold
5. Platinum
6. Emerald
7. Diamond

### ROI Distribution
- Daily automated distribution
- 300% cap per investment
- Configurable rates per package

### Booster Income
- 10% bonus when 2 directs purchase
- Time-limited activation

## Automated Cron Jobs

| Job | Schedule | Service |
|-----|----------|---------|
| ROI Distribution | Daily at 00:00 UTC | `cron/roi-distribution.ts` |
| Booster Expiration | Daily at 01:00 UTC | `services/booster.service.ts` |
| Business Volume | Daily at 02:00 UTC | `services/rewards.service.ts` |
| Binary Matching | Daily at 02:30 UTC | `cron/binary-matching.ts` |
| Monthly Rewards | 1st at 03:00 UTC | `services/rewards.service.ts` |

## Security Features

### Three-Layer Security
1. **JWT Authentication** - Token-based auth
2. **Application Authorization** - 99 admin functions secured
3. **Database RLS** - 80+ security policies across 21+ tables

## Development Workflow

### Phase 1: Initial Setup ✅
- [x] Create project folder
- [x] Clone repository
- [x] Install dependencies
- [x] Configure environment

### Phase 2: Documentation & Analysis (In Progress)
- [x] Build requirement memory system
- [ ] Document all menus
- [ ] Analyze existing code

### Phase 3: Testing & Validation
- [ ] Test server startup
- [ ] Test admin menus
- [ ] Test user menus
- [ ] Set up automated testing

### Phase 4: Build & Optimization
- [ ] Run production build
- [ ] Fix build errors
- [ ] Optimize performance
- [ ] Security audit

### Phase 5: Continuous Development
- [ ] Implement auto-testing
- [ ] Bug fixing workflow
- [ ] Feature enhancement
- [ ] Documentation updates

## Testing Strategy

### Unit Tests (Jest)
- Test individual functions
- Mock external dependencies
- Coverage target: 80%

### Integration Tests (Supertest)
- Test API endpoints
- Database operations
- Authentication flows

### E2E Tests (Playwright)
- Test complete user workflows
- Admin operations
- Critical paths

## Known Issues

1. **npm vulnerabilities**: 99 packages with vulnerabilities (35 low, 9 moderate, 50 high, 5 critical)
   - Status: Acknowledged
   - Resolution: Review and update packages as needed

## Next Steps

1. Complete admin/user menu documentation
2. Test server startup and all routes
3. Set up automated testing framework
4. Run initial build and fix issues
5. Implement continuous development workflow with auto-testing

## Useful Commands

```bash
# Check MySQL database
mysql -u root -proot finaster_mlm -e "SHOW TABLES;"

# View server logs
npm run dev:server 2>&1 | tee logs/server.log

# Check for TypeScript errors
npm run typecheck

# Build and preview production
npm run build && npm run preview

# Run specific test suites (when implemented)
npm test -- --grep "Admin Dashboard"
```

## File Structure

```
AsterDex_MLM_vNext/
├── app/                    # Frontend application
│   ├── api/               # API client
│   ├── components/        # React components
│   ├── context/           # Context providers
│   ├── hooks/             # Custom hooks
│   ├── layouts/           # Layout components
│   ├── pages/             # Page components
│   │   ├── admin/        # Admin pages (15+)
│   │   └── user/         # User pages (13+)
│   ├── services/          # Frontend services (30+)
│   ├── styles/            # Global styles
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── server/                 # Backend server
│   ├── cron/              # Cron job handlers
│   ├── middleware/        # Express middleware
│   ├── routes/            # API routes (15+)
│   ├── services/          # Business logic services
│   ├── db.ts              # Database connection
│   └── index.ts           # Server entry point
├── public/                 # Static assets
├── database/              # Database scripts
├── scripts/               # Build scripts
├── .claude/               # Development documentation
│   ├── requirements-memory.json
│   └── DEVELOPMENT_GUIDE.md
├── .env                   # Environment variables
├── package.json           # Dependencies
├── vite.config.ts         # Vite configuration
└── tsconfig.json          # TypeScript configuration
```

## Support & Resources

- **Project README**: See `README.md` for general information
- **Deployment Guide**: See `DEPLOYMENT.md` for production setup
- **API Documentation**: See `ADMIN_API_DOCUMENTATION.md`
- **Requirements Memory**: See `.claude/requirements-memory.json`

---

**Last Updated**: 2025-11-12
**Version**: 1.0.0
**Status**: Initial Setup Complete (15%)
