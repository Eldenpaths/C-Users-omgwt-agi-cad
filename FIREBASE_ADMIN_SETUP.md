# Firebase Admin SDK Setup Guide

This guide explains how to set up Firebase Admin SDK credentials for server-side operations in AGI-CAD.

## Why Do You Need This?

Firebase Admin SDK allows your server-side code (API routes, background jobs, etc.) to:
- Access Firestore with admin privileges
- Bypass security rules
- Perform batch operations
- Log telemetry and error data

## Quick Setup

### Step 1: Generate Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **agi-cad-science-labs**
3. Click the gear icon (⚙️) → **Project Settings**
4. Navigate to the **Service Accounts** tab
5. Click **Generate New Private Key**
6. Confirm by clicking **Generate Key**
7. A JSON file will be downloaded to your computer

### Step 2: Configure Environment Variables

You have two options for configuring credentials:

#### Option 1: JSON String (Recommended for Vercel/Production)

1. Open the downloaded JSON file in a text editor
2. Copy the entire JSON content
3. Add it to your `.env.local` file:

```bash
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"agi-cad-science-labs",...}
```

**Note**: Paste the entire JSON as a single line. Don't add line breaks.

#### Option 2: File Path (Alternative for Local Development)

1. Save the downloaded JSON file in a secure location (e.g., `./config/service-account.json`)
2. **Important**: Add this file to `.gitignore` to prevent committing credentials
3. Add the file path to `.env.local`:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account.json
```

### Step 3: Verify Setup

After configuring the credentials, restart your Next.js development server:

```bash
# Stop the current server (Ctrl+C)
pnpm dev
```

You should see a log message like:
```
[FirebaseAdmin] Initializing with GOOGLE_APPLICATION_CREDENTIALS_JSON
```

If you see an error instead, check:
- ✅ The JSON is valid (use a JSON validator)
- ✅ No extra quotes or escaping issues
- ✅ The environment variable is in `.env.local` (not `.env.example`)
- ✅ You restarted the dev server

## For Vercel Deployment

When deploying to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - **Value**: Paste the entire JSON content from your service account file
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application

## Troubleshooting

### Error: "Cannot read properties of undefined (reading 'length')"

**Cause**: Firebase Admin SDK is not initialized properly.

**Solution**:
1. Ensure `GOOGLE_APPLICATION_CREDENTIALS_JSON` is set in `.env.local`
2. Verify the JSON is valid (no syntax errors)
3. Restart your development server

### Error: "Firebase Admin initialization failed"

**Cause**: The credentials are missing or invalid.

**Solution**:
1. Verify the service account JSON has all required fields:
   - `type`
   - `project_id`
   - `private_key_id`
   - `private_key`
   - `client_email`
2. Regenerate the service account key if needed
3. Ensure the environment variable is spelled correctly

### Error: "Permission denied"

**Cause**: The service account doesn't have sufficient permissions.

**Solution**:
1. Go to [IAM & Admin](https://console.cloud.google.com/iam-admin)
2. Find the service account email (from your JSON file)
3. Ensure it has the role: **Firebase Admin SDK Administrator Service Agent**

## Security Best Practices

🔒 **Never commit service account credentials to version control**

- Add `service-account*.json` to `.gitignore`
- Use environment variables for all credentials
- Rotate keys periodically (every 90 days)
- Use separate service accounts for dev/staging/production

🔐 **Limit service account permissions**

- Only grant necessary Firebase/Firestore permissions
- Use custom IAM roles if possible
- Review access regularly

## What's Been Fixed

The Firebase Admin initialization (`src/lib/server/firebaseAdmin.ts`) now:

✅ Supports multiple credential methods (JSON string, file path, application default)
✅ Provides clear error messages when credentials are missing
✅ Uses caching to prevent multiple initialization attempts
✅ Adds defensive checks to prevent undefined errors
✅ Logs initialization method for debugging

## Need Help?

If you're still experiencing issues:

1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure you're using the correct Firebase project
4. Try regenerating the service account key

For more information, see:
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Service Accounts Overview](https://cloud.google.com/iam/docs/service-accounts)
