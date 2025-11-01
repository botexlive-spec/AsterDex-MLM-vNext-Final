# Multi-Level User Creation Testing Guide

## ✅ Registration Bug Fixed!

The critical registration bug has been **FIXED**. You can now create multiple users to test the 10-level MLM structure.

### What Was Fixed:
- Changed `.single()` to `.maybeSingle()` in `app/services/auth.service.ts`
- Added fallback handling for when user profile doesn't exist yet in `users` table
- Registration now works even if email confirmation is pending

---

## 🎯 Referral Code Feature (Already Implemented!)

The referral code auto-fill from URL parameter is **already working** in Register.tsx:

```typescript
// Line 14 in Register.tsx
const referralCode = searchParams.get('ref') || '';

// Line 21 - Auto-fills the form
referral_code: referralCode,
```

---

## 📋 How to Test Multi-Level Structure

### Step 1: Create First User (Level 1)
1. Go to: `http://localhost:5174/register`
2. Fill in the form:
   - Full Name: "Level 1 User"
   - Email: "level1@test.com"
   - Password: "testpass123"
   - Confirm Password: "testpass123"
   - Referral Code: (leave empty - this is the root user)
3. Agree to terms
4. Click "Create Account"
5. **Save the User ID** that gets created (you'll need it for Level 2)

### Step 2: Create Second User (Level 2)
1. Go to: `http://localhost:5174/register?ref=LEVEL1_USER_ID`
   - Replace `LEVEL1_USER_ID` with the actual ID from Step 1
2. Fill in the form:
   - Full Name: "Level 2 User"
   - Email: "level2@test.com"
   - Password: "testpass123"
   - Confirm Password: "testpass123"
   - Referral Code: **Should be auto-filled!** ✅
3. Agree to terms
4. Click "Create Account"
5. **Save the User ID** for Level 3

### Step 3: Continue Creating Users (Levels 3-10)
Repeat Step 2 for each level, using the pattern:
- Level 3: `http://localhost:5174/register?ref=LEVEL2_USER_ID`
- Level 4: `http://localhost:5174/register?ref=LEVEL3_USER_ID`
- Level 5: `http://localhost:5174/register?ref=LEVEL4_USER_ID`
- Level 6: `http://localhost:5174/register?ref=LEVEL5_USER_ID`
- Level 7: `http://localhost:5174/register?ref=LEVEL6_USER_ID`
- Level 8: `http://localhost:5174/register?ref=LEVEL7_USER_ID`
- Level 9: `http://localhost:5174/register?ref=LEVEL8_USER_ID`
- Level 10: `http://localhost:5174/register?ref=LEVEL9_USER_ID`

---

## 🔍 Verification Checklist

After creating users, verify:

- [ ] All 10 users were created successfully
- [ ] Referral codes were auto-filled for levels 2-10
- [ ] Each user can log in with their credentials
- [ ] User hierarchy is correctly established in the database
- [ ] Downline structure shows correct parent-child relationships

---

## 📊 Testing the MLM Structure

### Test Commission Flow
1. Have Level 10 user purchase a package
2. Check that all parent users (Levels 1-9) receive commissions
3. Verify commission percentages are correct for each level

### Test Binary Matching
1. Create users in both legs of the binary tree
2. Purchase packages to generate volume
3. Check that matching bonuses are calculated correctly

### Test Rank Advancement
1. Meet rank requirements with Level 1 user
2. Verify rank is updated correctly
3. Check that rank bonuses are applied

---

## 🐛 Troubleshooting

### "Cannot coerce the result to a single JSON object"
- **Status**: ✅ FIXED
- If you still see this error, refresh the page or restart the dev server

### Referral code not auto-filling
- Check that URL has `?ref=USER_ID` parameter
- Verify the USER_ID is correct
- Check browser console for any errors

### Users not showing in hierarchy
- Check database `users` table for `referrer_id` or `sponsor_id` field
- Verify database triggers are creating user profiles correctly
- Check that email confirmation is not blocking user creation

---

## 📝 Quick Test Script

Use this template for quick testing:

```
Level 1: level1@test.com (testpass123) - ROOT USER
Level 2: level2@test.com (testpass123) - ?ref=LEVEL1_ID
Level 3: level3@test.com (testpass123) - ?ref=LEVEL2_ID
Level 4: level4@test.com (testpass123) - ?ref=LEVEL3_ID
Level 5: level5@test.com (testpass123) - ?ref=LEVEL4_ID
Level 6: level6@test.com (testpass123) - ?ref=LEVEL5_ID
Level 7: level7@test.com (testpass123) - ?ref=LEVEL6_ID
Level 8: level8@test.com (testpass123) - ?ref=LEVEL7_ID
Level 9: level9@test.com (testpass123) - ?ref=LEVEL8_ID
Level 10: level10@test.com (testpass123) - ?ref=LEVEL9_ID
```

---

## 🎉 Expected Results

After completing all steps:

1. ✅ 10 users created successfully
2. ✅ Each user (except Level 1) has a referrer
3. ✅ Referral codes auto-filled correctly
4. ✅ All users can log in
5. ✅ Commission structure can be tested
6. ✅ Binary matching can be tested
7. ✅ Rank progression can be tested

---

## 💡 Additional Features Already Working

### 1. Registration Page Features:
- ✅ Referral code auto-fill from URL (`?ref=USER_ID`)
- ✅ Success alert when referral code is applied
- ✅ Email validation with proper regex
- ✅ Password validation (min 8 characters)
- ✅ Password confirmation matching
- ✅ Terms and conditions checkbox
- ✅ Responsive design (mobile + desktop)

### 2. Benefits Display:
- ✅ Shows 30-Level Income
- ✅ Shows Binary Matching Bonuses
- ✅ Shows DEX Trading
- ✅ Shows Rank Rewards
- ✅ Shows Booster Income
- ✅ Shows ROI Earnings

### 3. User Experience:
- ✅ Loading spinner during registration
- ✅ Error messages for validation failures
- ✅ Success message after registration
- ✅ Auto-redirect to login page after success
- ✅ Back to home button

---

## 🚀 Next Steps

After verifying the 10-level structure works:

1. **Test Commission Calculations**
   - Verify 30-level commissions
   - Test binary matching bonuses
   - Check rank-based bonuses

2. **Test Team Features**
   - View genealogy/tree
   - Check team statistics
   - Verify downline counts

3. **Test Admin Features**
   - View user hierarchy in admin panel
   - Manage user levels
   - Adjust commissions manually if needed

---

## ⚡ Pro Tips

1. **Use Incognito Windows**: Test multiple users by opening incognito windows for each user
2. **Browser DevTools**: Keep browser console open to catch any errors
3. **Database Tools**: Use Supabase dashboard to verify user creation and relationships
4. **Screenshot IDs**: Take screenshots of user IDs as you create them
5. **Test Order**: Always test from Level 1 down to Level 10 sequentially

---

## 📞 Support

If you encounter any issues:
1. Check browser console for errors
2. Verify dev server is running (`http://localhost:5174/`)
3. Check that Supabase connection is working
4. Verify database tables exist (`users`, `auth.users`)
5. Review `REGISTRATION_BUG_FIX.md` for technical details

---

**Status**: ✅ Ready to test multi-level structure!
**Date Fixed**: 2025-10-31
**Fixed Issues**: Registration bug, multi-level user creation now possible
