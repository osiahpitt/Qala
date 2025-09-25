# Supabase Project Configuration for www.qalatalk.com

## Critical Supabase Settings for Production

### 1. Site URL Configuration
In your Supabase project settings (https://supabase.com/dashboard/project/xjxfmuosmsieskgebzwg/settings/general):

**Site URL**: `https://www.qalatalk.com`

### 2. Redirect URLs Configuration
In Authentication → URL Configuration:

**Allowed redirect URLs**:
```
https://www.qalatalk.com
https://www.qalatalk.com/**
https://www.qalatalk.com/auth/callback
https://qalatalk.com
https://qalatalk.com/**
https://qalatalk.com/auth/callback
http://localhost:3000
http://localhost:3000/**
http://localhost:3000/auth/callback
```

### 3. CORS Origins
In Authentication → URL Configuration:

**Additional redirect URLs**:
```
https://www.qalatalk.com
https://qalatalk.com
```

### 4. Authentication Providers
Ensure Email provider is enabled with these settings:
- **Enable email confirmations**: Enabled
- **Secure email change**: Enabled
- **Double confirm email changes**: Disabled (for better UX)

### 5. Rate Limiting
In Authentication → Rate Limits:
- **Email signups**: 30 per hour per IP (default)
- **Password signins**: 30 per hour per IP (default)
- **Password recovery**: 30 per hour per IP (default)

### 6. Security Settings
In Authentication → Settings:
- **JWT expiry limit**: 3600 seconds (1 hour)
- **Refresh token rotation**: Enabled
- **Automatic reuse detection**: Enabled

## Environment Variables Required

Ensure these are set in your Vercel project (https://vercel.com/your-team/qala/settings/environment-variables):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xjxfmuosmsieskgebzwg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Testing the Configuration

1. **Test from production domain**: Visit https://www.qalatalk.com/auth/login
2. **Check browser network tab**: Look for successful requests to your Supabase URL
3. **Verify CORS**: Ensure no CORS errors in the browser console
4. **Test authentication flow**: Sign up → email verification → sign in

## Common Issues & Solutions

### Issue: "Authentication timeout after 10 seconds"
**Status**: FIXED - Removed artificial timeout in auth.ts

### Issue: CORS errors
**Solution**: Ensure www.qalatalk.com is in Supabase redirect URLs

### Issue: "Invalid redirect URL"
**Solution**: Add exact URL to Supabase allowed redirect URLs

### Issue: "Network error" during auth
**Solution**: Check that NEXT_PUBLIC_SUPABASE_URL is correct and accessible

## Post-Fix Verification

After applying these fixes:

1. Deploy the updated code to Vercel
2. Test authentication on www.qalatalk.com
3. Check that auth completes within reasonable time (should be 2-5 seconds)
4. Verify successful redirect to dashboard after login

## Critical Files Changed

1. `/src/lib/supabase.ts` - Updated client configuration
2. `/src/lib/auth.ts` - Removed timeout and improved error handling
3. `/next.config.ts` - Added CORS headers
4. Supabase project settings - URL configuration

## Next Steps

1. Update Supabase project settings as documented above
2. Deploy changes to Vercel
3. Test authentication flow on production domain
4. Monitor for any remaining timeout issues