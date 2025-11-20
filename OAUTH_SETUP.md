# OAuth Setup Guide (Google & Apple Sign-In)

## 🎉 What You Get

**FREE** and super-easy one-click login with Google and Apple accounts!

Your users can now:
- ✅ Sign up in **2 seconds** with their Google/Apple account
- ✅ No password to remember
- ✅ Auto-verified email (no verification emails needed for OAuth users)
- ✅ Profile pictures automatically imported

---

## 🔧 Setup Instructions

### Google OAuth (100% Free)

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a project** (or select existing)
3. **Enable Google+ API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. **Create OAuth credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:4321/api/auth/oauth/google/callback` (for development)
     - `https://tellurideskihotels.com/api/auth/oauth/google/callback` (for production)
5. **Copy your credentials**:
   - Client ID
   - Client Secret

### Apple Sign-In (100% Free with Apple Developer Account)

**Note**: Requires Apple Developer account ($99/year) - but the OAuth itself is free!

1. **Go to Apple Developer Portal**: https://developer.apple.com/account/
2. **Register an App ID**:
   - Identifiers → App IDs → Create
   - Enable "Sign in with Apple"
3. **Create a Service ID**:
   - Identifiers → Services IDs → Create
   - Configure "Sign in with Apple":
     - Web domains: `tellurideskihotels.com`
     - Return URLs: `https://tellurideskihotels.com/api/auth/oauth/apple/callback`
4. **Create a Key**:
   - Keys → Create → Enable "Sign in with Apple"
   - Download the .p8 private key file (only chance to download!)
5. **Copy your credentials**:
   - Service ID (Client ID)
   - Team ID
   - Key ID
   - Private Key content

---

## 📝 Environment Variables

Add these to your `.env` file or Netlify environment variables:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Apple OAuth (optional)
APPLE_CLIENT_ID="com.tellurideskihotels.service"
APPLE_TEAM_ID="YOUR_TEAM_ID"
APPLE_KEY_ID="YOUR_KEY_ID"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourPrivateKeyHere\n-----END PRIVATE KEY-----"
```

**Production URL** (already configured):
```bash
PUBLIC_SITE_URL="https://tellurideskihotels.com"
```

---

## 🚀 How It Works

1. **User clicks "Continue with Google" or "Continue with Apple"**
2. **They're redirected to Google/Apple** for authentication
3. **OAuth callback receives user info** (email, name, profile picture)
4. **Account created or linked automatically** (email verified by default)
5. **User is signed in** and redirected to their dashboard

### Benefits:
- ✅ **No email verification needed** for OAuth users
- ✅ **Auto-link to existing email/password accounts**
- ✅ **Profile pictures imported** from Google
- ✅ **Guest bookings claimed** when signing up with OAuth
- ✅ **Security**: No passwords stored for OAuth users

---

## 🧪 Testing

### Google OAuth:
- Works in localhost and production
- Test in development: `http://localhost:4321`

### Apple OAuth:
- **Requires HTTPS** (won't work on localhost)
- Test on production or use ngrok for local testing

---

## 💰 Cost

- **Google OAuth**: **100% FREE** forever
- **Apple OAuth**: FREE (requires Apple Developer account: $99/year for all Apple dev tools)

Both have generous free tiers and no per-user costs.

---

## 🎨 What Changed

### New Files:
- `/api/auth/oauth/google.ts` - Google OAuth initiation
- `/api/auth/oauth/google/callback.ts` - Google OAuth callback
- `/api/auth/oauth/apple.ts` - Apple OAuth initiation  
- `/api/auth/oauth/apple/callback.ts` - Apple OAuth callback

### Updated Files:
- `src/lib/auth.ts` - Added OAuth user support
- `src/components/account/AccountLogin.tsx` - Added OAuth buttons
- `src/components/account/AccountSignup.tsx` - Added OAuth buttons

### UI Changes:
- Beautiful Google and Apple sign-in buttons on login/signup pages
- "Or continue with email" divider
- Proper OAuth provider icons and branding

---

## 📱 User Experience

**Before**: 
1. Enter email, password, name
2. Submit
3. Check email
4. Click verification link
5. Done (5 steps)

**After**:
1. Click "Continue with Google"
2. Done (1 click!)

Users love it! 🎉

