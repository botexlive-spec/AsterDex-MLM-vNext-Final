# CRITICAL: Registration Bug Fix

## Problem
Registration is completely broken with error: **"Cannot coerce the result to a single JSON object"**

## Root Cause
The error occurs in `app/services/auth.service.ts` at line 37-43 in the `signUp` function.

After creating a user with `supabase.auth.signUp()`, the code immediately tries to fetch the user from the `users` table using `.single()`. However, the user row might not exist yet in the custom `users` table because:

1. Email confirmation might be pending
2. Database triggers haven't executed yet
3. The user only exists in Supabase Auth, not in the custom `users` table yet

The `.single()` method throws an error when no rows are returned, causing registration to fail.

## Solution

Replace lines 36-43 in `app/services/auth.service.ts`:

### ❌ BEFORE (Broken):
```typescript
    // Fetch the full user profile from our custom users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();  // ❌ This throws error if no row exists

    if (userError) throw userError;  // ❌ This stops registration
```

### ✅ AFTER (Fixed):
```typescript
    // Try to fetch the user profile from our custom users table
    // Use maybeSingle() instead of single() to handle cases where user doesn't exist yet
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();  // ✅ Returns null if no row, doesn't throw error

    // If user profile doesn't exist yet (email confirmation pending or trigger hasn't run),
    // return a minimal user object with auth data
    if (userError || !userData) {
      console.warn('User profile not yet created in users table:', userError?.message);

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email || data.email,
          full_name: data.full_name,
          created_at: authData.user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as User,
        token: authData.session?.access_token || '',
        refreshToken: authData.session?.refresh_token,
      };
    }
```

## Complete Fixed signUp Function

```typescript
export const signUp = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          wallet_address: data.wallet_address,
        },
      },
    });

    if (error) throw error;
    if (!authData.user) throw new Error('User creation failed');

    // Try to fetch the user profile from our custom users table
    // Use maybeSingle() instead of single() to handle cases where user doesn't exist yet
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    // If user profile doesn't exist yet (email confirmation pending or trigger hasn't run),
    // return a minimal user object with auth data
    if (userError || !userData) {
      console.warn('User profile not yet created in users table:', userError?.message);

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email || data.email,
          full_name: data.full_name,
          created_at: authData.user.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as User,
        token: authData.session?.access_token || '',
        refreshToken: authData.session?.refresh_token,
      };
    }

    return {
      user: userData as User,
      token: authData.session?.access_token || '',
      refreshToken: authData.session?.refresh_token,
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(error.message || 'Failed to sign up');
  }
};
```

## Why This Fix Works

1. **`.maybeSingle()` vs `.single()`**:
   - `.single()` = Expects exactly 1 row, throws error if 0 or 2+ rows
   - `.maybeSingle()` = Returns null if 0 rows, doesn't throw error

2. **Fallback User Object**:
   - If the `users` table row doesn't exist yet, we return a minimal user object with data from Supabase Auth
   - This allows registration to complete successfully
   - The user can still verify their email and log in
   - When they log in, the `users` table row should exist (created by trigger or email confirmation)

3. **Warning Log**:
   - Logs a warning if the user doesn't exist yet
   - Helps with debugging without breaking registration

## Testing

After applying this fix:

1. Go to `/register`
2. Fill in the registration form
3. Click "Create Account"
4. Should see success message: "Registration successful! Please check your email for verification."
5. Should navigate to `/login`
6. No more "Cannot coerce the result to a single JSON object" error

## Additional Notes

- This fix assumes email confirmation is required
- If you want to auto-create users in the `users` table, you should set up a Supabase database trigger
- The login function still uses `.single()` which is correct since logged-in users MUST exist in the users table

## Priority

⚠️ **CRITICAL** - Registration is completely broken without this fix. Apply immediately.
