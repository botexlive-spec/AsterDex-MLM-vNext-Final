# AsterDex MLM vNext - Testing Guide

## Overview

This guide outlines the comprehensive testing strategy for the AsterDex MLM platform, including automated testing, continuous integration, and bug fixing workflows.

## Testing Pyramid

```
        /\
       /E2E\          End-to-End Tests (Critical Paths)
      /------\
     /  API   \       Integration Tests (API Endpoints)
    /----------\
   /   Unit     \     Unit Tests (Functions & Components)
  /--------------\
```

## Test Framework Setup

### 1. Unit Testing (Jest + React Testing Library)

**Install Dependencies:**
```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Configuration (`jest.config.js`):**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'server/**/*.ts',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### 2. Integration Testing (Supertest)

**Install Dependencies:**
```bash
npm install --save-dev supertest @types/supertest
```

**Example Test:**
```typescript
import request from 'supertest';
import app from '../server';

describe('Admin Dashboard API', () => {
  it('should return dashboard stats', async () => {
    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);

    expect(response.body).toHaveProperty('totalUsers');
    expect(response.body).toHaveProperty('totalPackages');
  });
});
```

### 3. E2E Testing (Playwright)

**Install Dependencies:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

**Configuration (`playwright.config.ts`):**
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev:all',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
```

## Test Coverage Targets

| Category | Target | Priority |
|----------|--------|----------|
| Critical Paths | 100% | High |
| Admin Features | 90% | High |
| User Features | 85% | High |
| Services | 80% | Medium |
| Utilities | 75% | Medium |
| Components | 70% | Low |

## Admin Menu Testing Checklist

### Dashboard
- [ ] Load dashboard statistics
- [ ] Verify data accuracy
- [ ] Test date range filters
- [ ] Check performance metrics

### User Management
- [ ] List all users with pagination
- [ ] Search users by email/name
- [ ] Create new user
- [ ] Update user details
- [ ] Delete user
- [ ] Change user status

### KYC Management
- [ ] List pending KYC submissions
- [ ] View KYC documents
- [ ] Approve KYC
- [ ] Reject KYC with reason
- [ ] Search KYC by user

### Package Management
- [ ] List all packages
- [ ] Create new package
- [ ] Update package details
- [ ] Delete package
- [ ] Configure ROI settings

### Commission Management
- [ ] View 30-level commission structure
- [ ] Update commission rates
- [ ] Save configuration
- [ ] Validate rate constraints

### Binary Management
- [ ] View binary tree structure
- [ ] Configure matching bonus
- [ ] Calculate leg volumes
- [ ] Process matching bonus

### Financial Management
- [ ] List pending deposits
- [ ] Approve deposit
- [ ] Reject deposit
- [ ] List pending withdrawals
- [ ] Process withdrawal
- [ ] View transaction history

### Reports
- [ ] Generate user report
- [ ] Generate financial report
- [ ] Generate commission report
- [ ] Export report to CSV/PDF
- [ ] Schedule automated reports

### Communications
- [ ] Send email to users
- [ ] Send SMS notifications
- [ ] Send push notifications
- [ ] View communication logs

### Support Management
- [ ] List support tickets
- [ ] View ticket details
- [ ] Reply to ticket
- [ ] Close ticket
- [ ] Escalate ticket

### Audit Logs
- [ ] View all system activities
- [ ] Filter by user
- [ ] Filter by action type
- [ ] Export audit logs

### System Configuration
- [ ] Update system settings
- [ ] Configure feature toggles
- [ ] Save configuration
- [ ] Test configuration changes

### Rank Management
- [ ] View rank criteria
- [ ] Update rank requirements
- [ ] Calculate user ranks
- [ ] Promote users

## User Menu Testing Checklist

### Dashboard
- [ ] Load user statistics
- [ ] View recent transactions
- [ ] Check package status
- [ ] View earnings summary

### Profile
- [ ] View profile details
- [ ] Update profile information
- [ ] Change password
- [ ] Upload avatar

### KYC Verification
- [ ] Submit KYC documents
- [ ] View verification status
- [ ] Resubmit rejected KYC

### Packages
- [ ] View available packages
- [ ] Purchase package
- [ ] View active packages
- [ ] Check ROI accumulation

### Earnings
- [ ] View earnings breakdown
- [ ] Filter by earning type
- [ ] View transaction history
- [ ] Export earnings report

### Genealogy
- [ ] View binary tree
- [ ] View unilevel tree
- [ ] Navigate tree structure
- [ ] View member details

### Referrals
- [ ] View referral link
- [ ] Copy referral link
- [ ] View direct referrals
- [ ] Check referral earnings

### Wallet
- [ ] Check wallet balance
- [ ] Request deposit
- [ ] Request withdrawal
- [ ] View transaction history

### Reports
- [ ] Generate income report
- [ ] Generate team report
- [ ] Export reports
- [ ] View historical reports

### Robot/Trading Bot
- [ ] Subscribe to robot
- [ ] View performance
- [ ] Manage subscription

### Ranks
- [ ] View current rank
- [ ] View rank progression
- [ ] Check rank requirements

### Settings
- [ ] Update preferences
- [ ] Configure notifications
- [ ] Set communication preferences

## API Endpoint Testing

### Authentication Endpoints
```bash
# Register
POST /api/auth/register
# Login
POST /api/auth/login
# Logout
POST /api/auth/logout
# Refresh Token
POST /api/auth/refresh
```

### Admin Endpoints
```bash
# Dashboard
GET /api/admin/dashboard

# Users
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/:id
DELETE /api/admin/users/:id

# KYC
GET /api/admin/kyc
PUT /api/admin/kyc/:id/approve
PUT /api/admin/kyc/:id/reject

# Packages
GET /api/admin/packages
POST /api/admin/packages
PUT /api/admin/packages/:id
DELETE /api/admin/packages/:id

# Financial
GET /api/admin/deposits
PUT /api/admin/deposits/:id/approve
GET /api/admin/withdrawals
PUT /api/admin/withdrawals/:id/process
```

### User Endpoints
```bash
# Dashboard
GET /api/dashboard

# Profile
GET /api/profile
PUT /api/profile

# Packages
GET /api/packages
POST /api/packages/purchase

# Wallet
GET /api/wallet/balance
POST /api/wallet/deposit
POST /api/wallet/withdraw

# Team
GET /api/team/members
GET /api/genealogy/tree

# Transactions
GET /api/transactions
```

## Automated Testing Script

Create `scripts/run-tests.sh`:
```bash
#!/bin/bash

echo "🧪 Running AsterDex MLM Test Suite"
echo "=================================="

# Start MySQL
echo "1. Checking MySQL..."
mysql -u root -proot -e "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✓ MySQL is running"
else
  echo "✗ MySQL is not running. Starting MySQL..."
  # Start MySQL based on OS
fi

# Install test dependencies
echo ""
echo "2. Installing test dependencies..."
npm install --save-dev jest @types/jest supertest @playwright/test

# Run unit tests
echo ""
echo "3. Running unit tests..."
npm test -- --coverage

# Run integration tests
echo ""
echo "4. Running integration tests..."
npm run test:integration

# Run E2E tests
echo ""
echo "5. Running E2E tests..."
npm run test:e2e

# Generate test report
echo ""
echo "6. Generating test report..."
npm run test:report

echo ""
echo "✅ Test suite complete!"
```

## Continuous Testing Workflow

### Pre-Commit Testing
```bash
# Install husky
npm install --save-dev husky

# Create pre-commit hook
npx husky add .husky/pre-commit "npm run typecheck && npm test"
```

### CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/test.yml`:
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.4
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: finaster_mlm
        ports:
          - 3306:3306

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - run: npm install
      - run: npm run typecheck
      - run: npm test
      - run: npm run test:integration
      - run: npm run build
```

## Bug Fixing Workflow

### 1. Bug Detection
- Automated tests fail
- User reports issue
- Monitoring alerts

### 2. Bug Triage
- Assign severity (Critical/High/Medium/Low)
- Assign priority
- Create issue in tracking system

### 3. Bug Reproduction
- Write failing test that reproduces bug
- Document steps to reproduce
- Identify affected components

### 4. Bug Fix
- Implement fix
- Ensure test passes
- Run full test suite
- Code review

### 5. Bug Verification
- Verify fix in development
- Test in staging environment
- Deploy to production

### 6. Post-Fix
- Update documentation
- Update changelog
- Close issue

## Test Reporting

### Coverage Report
```bash
npm test -- --coverage --coverageReporters=html
open coverage/index.html
```

### Test Results Dashboard
- Total tests run
- Pass/fail rate
- Coverage percentage
- Performance metrics
- Flaky tests

## Performance Testing

### Load Testing (Artillery)
```bash
npm install --save-dev artillery

# Create load test
artillery quick --count 10 --num 100 http://localhost:3001/api/health
```

### Stress Testing
- Test with 1000 concurrent users
- Test database under load
- Test cron job performance

## Security Testing

### OWASP Top 10
- [ ] SQL Injection
- [ ] XSS
- [ ] CSRF
- [ ] Authentication bypass
- [ ] Authorization issues

### Penetration Testing
- Use tools like OWASP ZAP
- Test API security
- Test authentication flows

## Test Data Management

### Test Database
```bash
# Create test database
mysql -u root -proot -e "CREATE DATABASE finaster_mlm_test;"

# Seed test data
npm run seed:test
```

### Test Users
```javascript
const testUsers = {
  admin: { email: 'admin@test.com', password: 'Test123!' },
  user: { email: 'user@test.com', password: 'Test123!' },
  kyc_pending: { email: 'kyc@test.com', password: 'Test123!' },
};
```

## Monitoring & Alerting

### Error Tracking
- Implement Sentry or similar
- Track errors in production
- Alert on critical issues

### Performance Monitoring
- Track API response times
- Monitor database queries
- Track cron job execution

## Next Steps

1. Install testing dependencies
2. Write first unit test
3. Set up integration tests
4. Configure E2E tests
5. Set up CI/CD pipeline
6. Implement automated bug detection

---

**Last Updated**: 2025-11-12
**Status**: Draft - Implementation Pending
