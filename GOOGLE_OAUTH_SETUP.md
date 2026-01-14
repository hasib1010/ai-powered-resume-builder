# Fix Google OAuth Configuration

## The Error You're Seeing:
```
Access blocked: Authorisation error
Error 401: invalid_client
```

## Solution: Fix Google Cloud Console Settings

### Step 1: Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/apis/credentials
2. Sign in with your Google account
3. Select your project (or create a new one)

### Step 2: Create/Edit OAuth 2.0 Client ID

**If you haven't created credentials yet:**
1. Click **"+ CREATE CREDENTIALS"**
2. Select **"OAuth client ID"**
3. Choose **"Web application"**

**If you already have credentials:**
1. Find your existing OAuth 2.0 Client ID
2. Click the **edit icon** (pencil)

### Step 3: Configure Authorized Redirect URIs

**CRITICAL:** Add these EXACT URIs:

```
http://localhost:3000/api/auth/callback/google
```

For production, also add:
```
https://yourdomain.com/api/auth/callback/google
```

### Step 4: Save and Get New Credentials

1. Click **"SAVE"**
2. Copy your **Client ID**
3. Copy your **Client Secret**
4. Update your `.env.local` file

### Step 5: Update .env.local

Replace the Google OAuth credentials in your `.env.local`:

```env
GOOGLE_CLIENT_ID=your-new-client-id-here
GOOGLE_CLIENT_SECRET=your-new-client-secret-here
```

### Step 6: Restart Your Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

## ✅ Test Google Sign-In

1. Go to http://localhost:3000/login
2. Click "Sign in with Google"
3. Should work now!

## Common Issues:

### Issue 1: Still seeing "invalid_client"
- Make sure redirect URI is EXACTLY: `http://localhost:3000/api/auth/callback/google`
- No trailing slash
- Check for typos

### Issue 2: "This app isn't verified"
- This is normal for development
- Click "Advanced" → "Go to [Your App] (unsafe)"
- For production, submit for Google verification

### Issue 3: "Access blocked: This app's request is invalid"
- Enable Google+ API in Google Cloud Console
- Go to: https://console.cloud.google.com/apis/library
- Search for "Google+ API"
- Click "Enable"

## Security Reminder:

🚨 **YOU SHARED YOUR API KEYS PUBLICLY!**

Please regenerate ALL these immediately:

1. **OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Delete old key
   - Create new key
   - Update `.env.local`

2. **Google OAuth Credentials:**
   - Go to https://console.cloud.google.com/apis/credentials
   - Delete old OAuth client
   - Create new OAuth client
   - Update `.env.local`

3. **MongoDB Password:**
   - Go to https://cloud.mongodb.com
   - Database Access → Edit User
   - Change password
   - Update connection string in `.env.local`

4. **NextAuth Secret:**
   - Generate new: `openssl rand -base64 32`
   - Update `.env.local`

## Need Help?

If you still see errors:
1. Check the terminal/console for detailed error messages
2. Make sure all environment variables are set
3. Restart the dev server after any `.env.local` changes
