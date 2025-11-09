# Testing Guide for Finaster MLM System

## Manual Testing Checklist

### 1. Package Purchase & 30-Level Income
- User purchases package
- Check payouts table for 30-level entries
- Verify ineligible sponsors skipped
- Confirm no duplicate payouts

### 2. ROI-on-ROI Distribution
- Trigger daily ROI cron
- Check 15-level ROI-on-ROI payouts
- Verify decreasing percentages

### 3. Level Unlock System
- Create direct referrals
- Verify level_unlocks table updates
- Check UI shows correct unlock status

### 4. Booster System  
- Create 3 qualifying directs within 30 days
- Verify booster completion bonus
- Check countdown timer accuracy

### 5. Binary Matching
- Create binary tree structure
- Verify left/right volume calculations
- Check weaker leg identification

### 6. Monthly Rewards (3-Leg)
- Wait for monthly calculation (1st of month)
- Verify 40:40:20 ratio validation
- Check reward_distributions table

### 7. Caching Performance
- First load: ~100ms (cache miss)
- Second load: ~5ms (cache hit)  
- Verify cache invalidation on mutations

### 8. Admin Controls
- Toggle plan settings
- Verify menu items hide/show
- Check setting persistence

### 9. Reports & Export
- Load all 5 report types
- Apply filters and pagination
- Export CSV and verify format

### 10. Genealogy Tree
- Load binary tree
- Test tooltip positioning
- Verify no off-screen issues

## Automated Testing Recommendations

### Unit Tests (Jest/Mocha)
- level-income.service.test.ts
- binary-matching.service.test.ts
- rewards.service.test.ts
- cache.service.test.ts

### Integration Tests (Supertest)
- POST /api/packages/purchase
- POST /api/genealogy/add-member
- GET /api/dashboard
- GET /api/genealogy/tree

### Performance Tests (Apache Bench)
- Dashboard load: <10ms average
- Genealogy load: <50ms average

## Test Data Cleanup

Run after testing:
```sql
DELETE FROM payouts WHERE reference_id LIKE 'test-%';
DELETE FROM user_packages WHERE user_id LIKE 'test-%';
DELETE FROM users WHERE email LIKE '%@test.com';
```

## Continuous Integration

Recommended: GitHub Actions or GitLab CI
- Run tests on every commit
- Deploy only if tests pass

See claude-fix-summary.txt for complete testing details.
