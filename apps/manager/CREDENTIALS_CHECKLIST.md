# 🔐 Credentials Checklist

Quick reference for completing your EBOSS Manager setup.

## ✅ Configuration Status

### Microsoft Outlook / Azure AD
- [x] Client Secret configured ✅
- [ ] **Client ID needed** ⚠️
- [ ] Redirect URI verified
- [ ] API permissions granted

### Salesforce
- [ ] Consumer Key (Client ID)
- [ ] Consumer Secret
- [ ] Callback URL configured
- [ ] OAuth scopes granted

### Supabase
- [ ] Project URL
- [ ] Anon Key
- [ ] Database migration run

### Google Gemini AI (Optional)
- [ ] API Key

---

## 📝 What You Need to Add to `.env`

Open `/home/user/EBOSS-Manager/.env` and fill in these values:

### 1. Outlook Client ID (REQUIRED)
```bash
VITE_OUTLOOK_CLIENT_ID=
```
**Where to find it:**
- Azure Portal → App Registrations → Your App → Overview
- It's a UUID like: `12345678-1234-1234-1234-123456789abc`

### 2. Salesforce Credentials (REQUIRED)
```bash
VITE_SF_CLIENT_ID=
VITE_SF_CLIENT_SECRET=
```
**Where to find them:**
- Salesforce → Setup → App Manager → Your Connected App
- Click "Manage Consumer Details"

### 3. Supabase Credentials (REQUIRED)
```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
**Where to find them:**
- Supabase Dashboard → Your Project → Settings → API

### 4. Gemini AI (OPTIONAL)
```bash
GEMINI_API_KEY=
```
**Where to find it:**
- Google AI Studio → Create API Key

---

## 🚀 Quick Start After Setup

1. Add missing credentials to `.env`
2. Run database migration:
   ```bash
   supabase db push
   ```
3. Start the app:
   ```bash
   npm run dev
   ```
4. Go to Settings → Sync Settings
5. Connect Outlook and Salesforce
6. Start syncing!

---

## 📚 Detailed Instructions

See `docs/CREDENTIALS_SETUP.md` for complete setup instructions.

---

## Current Secrets Provided

✅ **Outlook Client Secret**: `[REDACTED — store in .env as VITE_OUTLOOK_CLIENT_SECRET]`
✅ **Secret ID** (reference only): `[REDACTED — Azure Portal reference only]`

⚠️ **Still needed:** Client ID from Azure Portal
