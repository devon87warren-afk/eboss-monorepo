# 🔐 Credentials Setup Guide

## Overview

This guide will help you securely configure all required credentials for EBOSS Manager integrations.

---

## ✅ Current Status

### Microsoft Outlook
- ✅ **Client Secret**: Configured
- ⚠️ **Client ID**: **NEEDED** - Please add this to `.env`
- ⚠️ **Redirect URI**: Verify in Azure AD

### Salesforce
- ⚠️ **Consumer Key**: Not configured
- ⚠️ **Consumer Secret**: Not configured

### Supabase
- ⚠️ **Project URL**: Not configured
- ⚠️ **Anon Key**: Not configured

---

## 📋 Step-by-Step Setup

### 1. Microsoft Outlook / Azure AD

You've already created the client secret. Now we need the Client ID:

#### Get Application (client) ID

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click on your app (e.g., "EBOSS Manager")
4. On the **Overview** page, find **Application (client) ID**
5. Copy the value (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
6. Add it to `.env`:
   ```bash
   VITE_OUTLOOK_CLIENT_ID=paste_your_client_id_here
   ```

#### Your Current Credentials

| Credential | Status | Value/Location |
|------------|--------|----------------|
| Client Secret | ✅ Configured | Already in `.env` |
| Secret ID | ℹ️ Reference Only | `34b89d6c-72e4-446c-8a76-91987cc298c9` |
| Client ID | ⚠️ **NEEDED** | Copy from Azure Portal Overview |

#### Verify Redirect URI

1. In Azure Portal → Your App → **Authentication**
2. Under **Platform configurations** → **Web** → **Redirect URIs**
3. Ensure this is listed:
   - **Development**: `http://localhost:3000`
   - **Production**: `https://your-domain.com` (add when deploying)

#### Verify API Permissions

1. Go to **API permissions**
2. Ensure these Microsoft Graph permissions are present and **granted**:
   - ✅ `Calendars.ReadWrite` (Delegated)
   - ✅ `Tasks.ReadWrite` (Delegated)
   - ✅ `User.Read` (Delegated)
   - ✅ `offline_access` (Delegated)
3. Click "Grant admin consent" if not already done

---

### 2. Salesforce Integration

#### Create Connected App (if not already done)

1. Log in to **Salesforce**
2. Go to **Setup** → **Apps** → **App Manager**
3. Click **New Connected App**
4. Fill in:
   - **Connected App Name**: `EBOSS Manager`
   - **API Name**: `EBOSS_Manager`
   - **Contact Email**: Your email
   - **Enable OAuth Settings**: ✅ Check this
   - **Callback URL**:
     ```
     http://localhost:3000/sf-callback
     ```
   - **Selected OAuth Scopes**:
     - ✅ `Access and manage your data (api)`
     - ✅ `Perform requests on your behalf at any time (refresh_token, offline_access)`
5. Click **Save**

#### Get Credentials

1. After saving, click **Manage Consumer Details** (you may need to verify your identity)
2. Copy the **Consumer Key** (this is your Client ID)
3. Copy the **Consumer Secret**
4. Add them to `.env`:
   ```bash
   VITE_SF_CLIENT_ID=your_consumer_key_here
   VITE_SF_CLIENT_SECRET=your_consumer_secret_here
   ```

#### For Sandbox Users

If you're using a Salesforce Sandbox:
```bash
VITE_SF_SANDBOX=true
```

---

### 3. Supabase Configuration

#### Get Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys")
5. Add them to `.env`:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

#### Run Database Migration

After configuring Supabase, run the migration:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Or manually run the SQL:
```bash
# Copy the contents of supabase/migrations/002_calendar_task_sync.sql
# and run it in Supabase SQL Editor
```

---

### 4. Google Gemini AI (Optional)

This is used for AI-powered ticket analysis. If you want this feature:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add it to `.env`:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

## 🔍 Verify Configuration

### Check .env File

Your `.env` file should now look like this:

```bash
# Microsoft Outlook
VITE_OUTLOOK_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_OUTLOOK_CLIENT_SECRET=your_outlook_client_secret_here
VITE_OUTLOOK_REDIRECT_URI=http://localhost:3000

# Salesforce
VITE_SF_CLIENT_ID=your_salesforce_consumer_key
VITE_SF_CLIENT_SECRET=your_salesforce_consumer_secret
VITE_SF_REDIRECT_URI=http://localhost:3000/sf-callback
VITE_SF_SANDBOX=false

# Supabase
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Gemini AI
GEMINI_API_KEY=your_gemini_key
```

### Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. Navigate to **Settings** → **Sync Settings**

4. Try connecting to Outlook:
   - Click "Connect Outlook"
   - You should be redirected to Microsoft login
   - Sign in and grant permissions
   - You should be redirected back to EBOSS Manager

5. Try connecting to Salesforce:
   - Click "Connect Salesforce"
   - Sign in to Salesforce
   - Click "Allow" to grant access
   - You should be redirected back

---

## 🔒 Security Best Practices

### ✅ DO

- ✅ Keep `.env` file in `.gitignore` (already configured)
- ✅ Never commit `.env` to version control
- ✅ Use different credentials for development/production
- ✅ Rotate secrets periodically
- ✅ Use environment-specific `.env` files:
  - `.env.development`
  - `.env.production`
- ✅ Store production secrets in secure vaults (Azure Key Vault, AWS Secrets Manager, etc.)

### ❌ DON'T

- ❌ Share your `.env` file
- ❌ Post credentials in Slack, email, or documentation
- ❌ Use production credentials in development
- ❌ Commit the `.env` file to Git
- ❌ Hardcode credentials in source code

### Secret Rotation

If you suspect a secret has been compromised:

**For Azure AD Client Secret:**
1. Azure Portal → App Registrations → Your App
2. Go to **Certificates & secrets**
3. Add a new client secret
4. Update `.env` with the new secret
5. Delete the old secret after testing

**For Salesforce:**
1. Salesforce Setup → App Manager → Your Connected App
2. Click **Edit Policies**
3. Click **Manage Consumer Details**
4. Reset the secret
5. Update `.env` with the new secret

---

## 🚨 Troubleshooting

### "Invalid Client" Error

**Problem**: Outlook or Salesforce login fails with "Invalid Client"

**Solutions**:
- Verify `VITE_OUTLOOK_CLIENT_ID` matches Azure AD Application ID
- Verify `VITE_SF_CLIENT_ID` matches Salesforce Consumer Key
- Check for typos or extra spaces in `.env`

### "Redirect URI Mismatch" Error

**Problem**: OAuth redirect fails

**Solutions**:
- Verify redirect URI in `.env` matches exactly what's registered
- For Outlook: Check Azure AD → Authentication → Redirect URIs
- For Salesforce: Check Connected App → Callback URL
- Ensure `http://` vs `https://` matches
- Ensure trailing slashes match (or don't)

### "Invalid Client Secret" Error

**Problem**: Authentication fails with invalid secret

**Solutions**:
- Verify you copied the **secret value**, not the secret ID
- The secret value starts with characters like `-xO8Q~`
- The secret ID is a UUID (not used in authentication)
- Regenerate the secret if you're unsure

### Environment Variables Not Loading

**Problem**: App can't access environment variables

**Solutions**:
- Ensure `.env` file is in the project root directory
- Restart the development server (`npm run dev`)
- Check that variables start with `VITE_` (required for Vite)
- Verify no syntax errors in `.env` file (no quotes needed for values)

---

## 📝 Next Steps

Once all credentials are configured:

1. ✅ Test Outlook connection
2. ✅ Test Salesforce connection
3. ✅ Run manual sync to import initial data
4. ✅ Enable auto-sync in Settings
5. ✅ Test creating events/tasks
6. ✅ Verify bidirectional sync works
7. ✅ Test conflict resolution

---

## 📞 Support

If you encounter issues:
1. Check the browser console for detailed error messages
2. Review Azure AD / Salesforce audit logs
3. Verify all credentials are correct
4. Try regenerating secrets and updating `.env`
5. Check network connectivity and firewall settings

---

## 🔗 Useful Links

- [Azure AD App Registration](https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps)
- [Salesforce Connected Apps](https://login.salesforce.com/lightning/setup/NavigationMenus/home)
- [Supabase Dashboard](https://app.supabase.com)
- [Google AI Studio](https://makersuite.google.com/app/apikey)
- [Microsoft Graph Permissions Reference](https://docs.microsoft.com/en-us/graph/permissions-reference)
- [Salesforce OAuth Scopes](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_scopes.htm)
