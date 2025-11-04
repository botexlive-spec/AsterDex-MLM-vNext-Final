# Support Tables Migration Instructions

Since automated migration scripts require special database access, please follow these manual steps to create the support tables.

---

## Option 1: Supabase Dashboard (Recommended) ⭐

### Steps:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login to your account
   - Select your project: `dsgtyrwtlpnckvcozfbc`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query" button

3. **Copy and Execute SQL**
   - Open the file: `database/create-support-tables.sql`
   - Copy ALL the SQL content (Ctrl+A, Ctrl+C)
   - Paste into the SQL Editor
   - Click "Run" button

4. **Verify Success**
   - You should see: "Success. No rows returned"
   - Check the "Table Editor" tab
   - Verify these 5 tables exist:
     - ✅ support_tickets
     - ✅ ticket_messages
     - ✅ canned_responses
     - ✅ chat_sessions
     - ✅ chat_messages

5. **Verify Seed Data**
   - Click on `canned_responses` table
   - You should see 4 pre-loaded responses:
     - Welcome Message
     - KYC Pending
     - Withdrawal Processing Time
     - Account Verification Required

**Time Required:** 2-3 minutes

---

## Option 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref dsgtyrwtlpnckvcozfbc

# Run migration
supabase db push --db-url "postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" < database/create-support-tables.sql
```

---

## Option 3: Direct PostgreSQL Connection

If you have PostgreSQL client installed:

```bash
psql "postgresql://postgres.dsgtyrwtlpnckvcozfbc:Dubai%401234%23@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres" -f database/create-support-tables.sql
```

---

## Verification Checklist

After running the migration, verify:

- [ ] All 5 tables created
- [ ] Indexes created (check with `\d+ support_tickets` in psql)
- [ ] RLS policies enabled (check Table Editor → Policies)
- [ ] Seed data loaded (4 canned responses)
- [ ] No errors in migration

---

## Testing After Migration

1. **Start the dev server:**
   ```bash
   cd C:\Projects\asterdex-8621-main
   npm run dev
   ```

2. **Navigate to Support page:**
   - Open: http://localhost:5173/admin/support
   - Login as admin

3. **Check console logs:**
   - Open browser DevTools (F12)
   - Look for: `📊 Loading Support Management data...`
   - Should see: `✅ Support data loaded: { tickets: 0, cannedResponses: 4, chatSessions: 0 }`

4. **Verify features:**
   - [ ] Dashboard shows 0 tickets
   - [ ] Canned Responses tab shows 4 responses
   - [ ] Can create new canned response
   - [ ] No error toasts appear
   - [ ] Loading completes within 2 seconds

---

## Troubleshooting

### Error: "Failed to load support data"
**Cause:** Tables don't exist yet or RLS policies blocking access

**Solution:**
1. Check if tables were created in Supabase dashboard
2. Verify you're logged in as admin user
3. Check browser console for specific error messages

### Error: "Request timed out after 10 seconds"
**Cause:** Database connection issue

**Solution:**
1. Check database is online in Supabase dashboard
2. Verify connection string is correct
3. Try refreshing the page

### Empty Dashboard
**Cause:** No tickets/chats created yet (this is normal!)

**Solution:**
- This is expected on fresh installation
- Create test tickets via user support form
- Or manually insert test data via SQL Editor

---

## Quick Copy-Paste for Supabase SQL Editor

Here's the complete SQL to copy-paste directly:

```sql
-- Just open create-support-tables.sql and copy everything!
-- The file is located at: database/create-support-tables.sql
```

---

## Need Help?

If you encounter any issues:

1. Check the Supabase dashboard for error messages
2. Look at browser console (F12) for detailed errors
3. Verify your admin user has proper permissions
4. Check that database is not in read-only mode

---

## Success Criteria

Migration is successful when:
- ✅ All 5 tables created without errors
- ✅ Page loads without timeout errors
- ✅ 4 canned responses visible
- ✅ Console shows "Support data loaded successfully"
- ✅ No red error toasts appear

**Estimated Time:** 3-5 minutes total
