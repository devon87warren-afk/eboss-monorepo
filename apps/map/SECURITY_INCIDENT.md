# SECURITY INCIDENT NOTICE

**Date:** March 7, 2026  
**Severity:** CRITICAL  
**Status:** REMEDIATED

## Incident Summary

A Google Cloud service account key file (`openai-stargate-eboss-map-9d6c77535bdf.json`) was accidentally committed to the repository, exposing sensitive credentials.

## Actions Taken

1. ✅ Removed the key file from the repository
2. ✅ Added ignore patterns to `.gitignore` to prevent future commits
3. ✅ Updated `.vscode/settings.json` to use template approach

## REQUIRED ACTIONS

### Immediate (DO NOW)

1. **Revoke the Compromised Key**
   - Go to [Google Cloud IAM Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
   - Select project: `openai-mapset-eboss-map`
   - Find service account: `nocodemap@openai-mapset-eboss-map.iam.gserviceaccount.com`
   - Delete key with ID: `9d6c77535bdfadca7347e2cda89f58d60cebe384`

2. **Generate New Key**
   - Create a new service account key
   - Download and store securely (NOT in the repository!)
   - Update any services/deployments using the old key

3. **Purge from Git History** (if already pushed)

   ```bash
   # Option 1: Using git-filter-repo (recommended)
   pip install git-filter-repo
   git filter-repo --path openai-stargate-eboss-map-9d6c77535bdf.json --invert-paths
   git push --force --all
   
   # Option 2: Using BFG Repo Cleaner
   java -jar bfg.jar --delete-files openai-stargate-eboss-map-9d6c77535bdf.json
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force --all
   ```

### Preventive Measures

1. **Use Secret Manager**
   - Store all credentials in Google Secret Manager
   - Reference secrets by name, not value
   - Already implemented in `functions/index.js`

2. **Update CI/CD**
   - Ensure secrets are injected at runtime
   - Never commit credentials to version control

3. **Enable Secret Scanning**
   - Enable GitHub Secret Scanning (if using GitHub)
   - Configure pre-commit hooks to detect credentials

## Files Modified

- `.gitignore` - Added patterns for service account keys
- `.vscode/settings.json` - Removed personal settings
- `.vscode/settings.json.example` - Created template file

## Audit Trail

**Exposed Credentials:**

- Project ID: `openai-mapset-eboss-map`
- Service Account: `nocodemap@openai-mapset-eboss-map.iam.gserviceaccount.com`
- Key ID: `9d6c77535bdfadca7347e2cda89f58d60cebe384`
- Client ID: `113157616339939121100`

**Repository:** stargate-eboss-map  
**Branch:** rename/stargate-to-mapset

## Verification Checklist

- [ ] Old key revoked in GCP IAM
- [ ] New key generated and securely stored
- [ ] Services updated with new key
- [ ] Git history cleaned (if pushed)
- [ ] Secret scanning enabled
- [ ] Team notified

---

**Contact:** Project Administrator  
**Reference:** SEC-2026-001
