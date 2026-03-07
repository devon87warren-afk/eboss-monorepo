# EBOSS Manager - Backend Setup Guide

This guide will help you connect your EBOSS Manager application to real backend services.

## 🚀 Quick Start

### Step 1: Set Up Supabase (Primary Database)

Supabase is the primary backend database for EBOSS Manager.

#### 1.1 Create a Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (free tier available)
3. Create a new project:
   - Choose a project name (e.g., "eboss-manager")
   - Set a strong database password (save this securely!)
   - Select a region closest to you
   - Wait 2-3 minutes for the project to be created

#### 1.2 Get Your Supabase Credentials
1. Once your project is ready, go to **Settings** → **API**
2. You'll find two important values:
   - **Project URL** (e.g., `https://abcdefghijklmn.supabase.co`)
   - **anon/public key** (a long JWT token starting with `eyJ...`)

#### 1.3 Add Credentials to `.env.local`
Open `F:\Repos\GitHub\EBOSS-Manager\.env.local` and update:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-key
```

### Step 2: Initialize the Database Schema

Now that Supabase is connected, you need to create the tables and structure.

#### Option A: Use the Automated Setup Script (Recommended)

Run this command in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File setup-remote-db.ps1
```

This will:
- ✅ Create all necessary tables (units, tickets, customers, etc.)
- ✅ Set up relationships and foreign keys
- ✅ Configure Row Level Security (RLS) policies
- ✅ Add initial seed data

#### Option B: Manual Setup via Supabase Dashboard

1. Go to your Supabase project → **SQL Editor**
2. Create a new query
3. Copy the SQL schema from the setup script
4. Execute the query

### Step 3: Verify the Connection

After setting up Supabase:

1. **Restart your dev server:**
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

2. **Check the browser console** - you should see:
   - No Supabase errors
   - Database connection successful
   - Data loading from Supabase instead of mock data

3. **Test the connection** - Open your app and:
   - Check if data persists after refresh
   - Try creating a new ticket
   - Verify changes are saved to Supabase

---

## 🔌 Optional Integrations

### Salesforce Integration (Optional)

For syncing customer data with Salesforce CRM.

#### Prerequisites
- Active Salesforce account (Developer Edition or higher)
- Salesforce Administrator access

#### Setup Steps

1. **Create a Connected App in Salesforce:**
   - Go to **Setup** → **Apps** → **App Manager**
   - Click **New Connected App**
   - Fill in:
     - **Connected App Name:** "EBOSS Manager"
     - **API Name:** `eboss_manager`
     - **Contact Email:** your email
   - **Enable OAuth Settings:**
     - ✅ Check "Enable OAuth Settings"
     - **Callback URL:** `http://localhost:3000/sf-callback`
     - **Selected OAuth Scopes:**
       - Full access (full)
       - Perform requests at any time (refresh_token, offline_access)
   - Click **Save** and wait 2-10 minutes for activation

2. **Get Your Credentials:**
   - After the app is created, click **Manage Consumer Details**
   - Copy the **Consumer Key** (Client ID)
   - Copy the **Consumer Secret** (Client Secret)

3. **Update `.env.local`:**
   ```env
   VITE_SF_CLIENT_ID=your_consumer_key_here
   VITE_SF_CLIENT_SECRET=your_consumer_secret_here
   VITE_SF_REDIRECT_URI=http://localhost:3000/sf-callback
   VITE_SF_SANDBOX=false  # Set to 'true' if using sandbox
   ```

---

### Outlook Integration (Optional)

For email synchronization and calendar integration.

#### Prerequisites
- Microsoft 365 or Outlook.com account
- Azure account (free tier available)

#### Setup Steps

1. **Register App in Azure Portal:**
   - Go to [https://portal.azure.com](https://portal.azure.com)
   - Navigate to **Azure Active Directory** → **App registrations**
   - Click **New registration**
   - Fill in:
     - **Name:** "EBOSS Manager"
     - **Supported account types:** Accounts in any organizational directory and personal Microsoft accounts
     - **Redirect URI:** `http://localhost:3000/outlook-callback` (Web)
   - Click **Register**

2. **Configure API Permissions:**
   - Go to **API permissions** → **Add a permission**
   - Select **Microsoft Graph**
   - Choose **Delegated permissions**
   - Add these permissions:
     - `Mail.Read`
     - `Mail.Send`
     - `Calendars.Read`
     - `Calendars.ReadWrite`
     - `User.Read`
   - Click **Grant admin consent**

3. **Create Client Secret:**
   - Go to **Certificates & secrets** → **Client secrets**
   - Click **New client secret**
   - Add description: "EBOSS Manager Dev"
   - Set expiration (recommend: 24 months)
   - Click **Add**
   - **IMPORTANT:** Copy the **Value** immediately (you won't be able to see it again!)

4. **Get Your Credentials:**
   - **Application (client) ID** from the Overview page
   - **Client secret value** from the previous step

5. **Update `.env.local`:**
   ```env
   VITE_OUTLOOK_CLIENT_ID=your_application_client_id
   VITE_OUTLOOK_CLIENT_SECRET=your_client_secret_value
   VITE_OUTLOOK_REDIRECT_URI=http://localhost:3000/outlook-callback
   ```

---

## 🧪 Testing Your Setup

### Test Supabase Connection

```javascript
// Open browser console at http://localhost:3000
// Run this command:
console.log('Supabase configured:', window.__SUPABASE_CONFIGURED__);
```

### Test Salesforce Sync
1. Click "Sync Salesforce" button in the sidebar
2. Follow OAuth login flow
3. Verify customer data synchronizes

### Test Outlook Integration
1. Navigate to email features
2. Click "Connect Outlook"
3. Authenticate with Microsoft
4. Verify emails appear in the app

---

## 🔧 Troubleshooting

### Supabase Connection Issues

**Error: "Invalid supabaseUrl"**
- ✅ Check that `VITE_SUPABASE_URL` starts with `https://`
- ✅ Verify the URL ends with `.supabase.co`
- ✅ Ensure no extra spaces or quotes

**Error: "Invalid API key"**
- ✅ Use the **anon/public** key, NOT the service_role key
- ✅ Copy the entire key (it's very long, starting with `eyJ`)
- ✅ Restart dev server after updating

### Database Schema Issues

**Error: "Table 'units' does not exist"**
- ✅ Run the setup script: `powershell -ExecutionPolicy Bypass -File setup-remote-db.ps1`
- ✅ Check Supabase Dashboard → Table Editor to verify tables exist

### OAuth Integration Issues

**Salesforce: "redirect_uri_mismatch"**
- ✅ Verify callback URL in Salesforce matches `.env.local` exactly
- ✅ Check for trailing slashes
- ✅ Wait 10 minutes after creating Connected App

**Outlook: "AADSTS50011: redirect URI mismatch"**
- ✅ Verify redirect URI in Azure Portal matches `.env.local`
- ✅ Ensure URI is registered under "Web" platform

---

## 📚 Next Steps

Once your backend is configured:

1. **Explore the Database:**
   - Open Supabase Dashboard → Table Editor
   - View and manage your data directly

2. **Set Up Production:**
   - Create a production Supabase project
   - Update environment variables for production
   - Configure proper Row Level Security policies

3. **Monitor Performance:**
   - Use Supabase Dashboard → Database → Performance
   - Monitor API usage and query performance

4. **Backup Your Data:**
   - Supabase provides automatic daily backups
   - Set up additional backup strategies for critical data

---

## 🆘 Need Help?

- **Supabase Docs:** [https://supabase.com/docs](https://supabase.com/docs)
- **Salesforce OAuth Guide:** [https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm](https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm)
- **Microsoft Graph API:** [https://learn.microsoft.com/en-us/graph/auth-v2-user](https://learn.microsoft.com/en-us/graph/auth-v2-user)

---

*Last updated: January 2026*
