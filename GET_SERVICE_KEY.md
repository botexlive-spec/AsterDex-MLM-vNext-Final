# 🔑 GET SUPABASE SERVICE ROLE KEY

## Quick Steps:

1. **Go to Supabase Dashboard:**
   - Open: https://app.supabase.com/project/dsgtyrwtlpnckvcozfbc

2. **Navigate to Settings:**
   - Click "Settings" in left sidebar
   - Click "API" section

3. **Find Service Role Key:**
   - Scroll to "Project API keys" section
   - Look for "service_role" key
   - Click "Reveal" button
   - Copy the key (starts with `eyJ...`)

4. **Add to .env file:**
   - Open `.env` file
   - Add this line:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

## ⚠️ IMPORTANT:
- This key has admin privileges
- Keep it secret
- Never commit to git
- Only use server-side

## After Adding:
Run: `node scripts/deploy-database-pg.cjs`
