# Salesforce Contact Ownership Transfer

## Problem Statement

You need to gain ownership of contacts in your Salesforce territory, but:
- ✅ Contacts already exist in Salesforce
- ❌ Your user profile doesn't have ownership
- ❌ You don't have access to Data Import Wizard

## Solutions Overview

### Option 1: Salesforce Data Loader (Recommended for Most Users)

**Best for:** Users who need a one-time or periodic bulk update

1. **Download Data Loader**
   - Go to: Setup → Data → Data Loader → Download
   - Or visit: https://developer.salesforce.com/tools/data-loader

2. **Export Contacts**
   ```
   Object: Contact
   Filter: Territory__c = 'YourTerritory' AND OwnerId != 'YourUserId'
   Fields: Id, Name, Email, OwnerId, Territory__c
   ```

3. **Update Ownership**
   - Open exported CSV file
   - Change `OwnerId` column to your User ID (find at Setup → Users → Your Name)
   - Save the file

4. **Import Updates**
   - Data Loader → Update operation
   - Select Contact object
   - Map `Id` field (required for updates)
   - Map `OwnerId` field to your updated values
   - Run update

**Pros:**
- ✅ No coding required
- ✅ Handles large datasets (millions of records)
- ✅ Built-in error handling and logs
- ✅ Works offline

**Cons:**
- ⚠️ Requires desktop application installation
- ⚠️ Manual process (not automated)

---

### Option 2: Salesforce Flow (No Code Automation)

**Best for:** Ongoing automation without coding

**Create a Screen Flow:**

```
1. Get Records
   - Object: Contact
   - Filter: Territory = Your Territory AND Owner != You

2. Loop through Records
   - For each Contact

3. Update Records
   - Set OwnerId = Your User ID

4. Schedule Daily/Weekly
```

**Setup Steps:**
1. Setup → Flows → New Flow
2. Choose "Scheduled Flow"
3. Set frequency (daily/weekly)
4. Add Get Records element (filter by territory)
5. Add Update Records element (set OwnerId)
6. Activate flow

**Pros:**
- ✅ Native Salesforce solution
- ✅ Runs automatically on schedule
- ✅ No coding required
- ✅ Point-and-click interface

**Cons:**
- ⚠️ May need admin help to deploy
- ⚠️ Governor limits apply (500 records per transaction in free orgs)

---

### Option 3: API Scripts (Full Automation)

**Best for:** Developers or users with API access who need programmatic control

#### Prerequisites

**Node.js Script:**
```bash
cd /home/user/EBOSS-Manager/scripts
npm install jsforce dotenv
```

**Python Script:**
```bash
cd /home/user/EBOSS-Manager/scripts
pip install simple-salesforce python-dotenv
```

#### Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file with your credentials:**
   ```bash
   # Find your Salesforce User ID
   # Setup → Users → Click your name → Look at URL: .../005XXXXXXXXXXXXXXX

   SF_USERNAME=your.email@company.com
   SF_PASSWORD=YourPassword123
   SF_TOKEN=YourSecurityToken
   SF_NEW_OWNER_ID=005XXXXXXXXXXXXXXX  # Your User ID
   SF_TERRITORY_ID=YOUR_TERRITORY_NAME
   SF_SANDBOX=false  # Set to 'true' for sandbox
   ```

3. **Get your Security Token:**
   - Settings → My Personal Information → Reset My Security Token
   - Check your email for the token

4. **Find your Territory ID:**
   - Option A: If using Territory2 object: Setup → Territory Models → Your Territory
   - Option B: If using custom field: Check Contact records for field name

#### Running the Scripts

**Node.js:**
```bash
node salesforce-ownership-transfer.js
```

**Python:**
```bash
python salesforce-ownership-transfer.py
```

#### What the Scripts Do

1. ✅ Login to Salesforce using your credentials
2. ✅ Query all contacts in your territory you don't own
3. ✅ Display sample of contacts to be transferred
4. ✅ Process updates in batches (200 records at a time)
5. ✅ Provide detailed progress updates
6. ✅ Generate summary report with success/error counts

**Example Output:**
```
🔐 Logging into Salesforce...
✅ Successfully logged in

📋 Querying contacts in territory...
📊 Found 1,247 contacts to transfer

📝 Sample contacts to transfer:
  1. John Smith (john@example.com) - Current Owner: Previous Rep
  2. Jane Doe (jane@example.com) - Current Owner: Previous Rep
  ...

🔄 Processing batch 1/7 (200 records)...
  ✅ Batch complete: 200 successful, 0 errors

============================================================
📊 TRANSFER SUMMARY
============================================================
✅ Successfully transferred: 1,247 contacts
❌ Failed transfers: 0 contacts
📈 Success rate: 100.0%
```

**Pros:**
- ✅ Fully automated
- ✅ Can be scheduled via cron/Task Scheduler
- ✅ Detailed logging and error handling
- ✅ Handles large volumes efficiently
- ✅ Can be customized for specific needs

**Cons:**
- ⚠️ Requires API access (usually available by default)
- ⚠️ Needs programming environment (Node.js or Python)
- ⚠️ Subject to API rate limits (default: 15,000 calls/24hrs)

---

### Option 4: Manual Ownership Transfer (Last Resort)

**Best for:** Small number of contacts (<100)

1. Go to Contacts list view
2. Filter by your Territory
3. Select contacts (up to 200 at a time)
4. Click "Change Owner" button
5. Select yourself as new owner
6. Confirm transfer

**Pros:**
- ✅ No setup required
- ✅ Works immediately

**Cons:**
- ⚠️ Tedious for large volumes
- ⚠️ Limited to 200 records at a time
- ⚠️ Prone to human error

---

## Scheduling Automation

### Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Run every Monday at 9 AM
0 9 * * 1 cd /home/user/EBOSS-Manager/scripts && /usr/bin/node salesforce-ownership-transfer.js >> /tmp/sf-transfer.log 2>&1
```

### Task Scheduler (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Weekly on Mondays)
4. Action: Start a Program
5. Program: `node.exe`
6. Arguments: `C:\path\to\salesforce-ownership-transfer.js`
7. Start in: `C:\path\to\EBOSS-Manager\scripts`

---

## Troubleshooting

### "INVALID_LOGIN" Error
- **Cause:** Incorrect username, password, or security token
- **Fix:** Verify credentials in `.env` file; reset security token if needed

### "INSUFFICIENT_ACCESS" Error
- **Cause:** Your profile lacks "Transfer Record" permission
- **Fix:** Ask admin to grant "Transfer Record" or "Modify All Data" permission

### "UNABLE_TO_LOCK_ROW" Error
- **Cause:** Another process is updating the same record
- **Fix:** The script automatically handles this with retries; just re-run if needed

### API Rate Limit Exceeded
- **Cause:** Too many API calls in 24-hour period
- **Fix:** Wait 24 hours or ask admin to increase limits (usually 15,000 calls/day)

### Territory Field Not Found
- **Cause:** Territory field name doesn't match your Salesforce setup
- **Fix:** Update the query in the script to use your actual territory field name

---

## Integration with EBOSS Manager

Once ownership is transferred, you can sync these contacts into EBOSS Manager:

1. **Automatic Sync:** The app's `syncSalesforce()` function can pull contact data
2. **Customer Management:** View contacts in the Customers tab
3. **Territory Tracking:** Monitor SLA compliance and last interaction dates
4. **Service Integration:** Link contacts to units and service tickets

The EBOSS Manager already has Salesforce customer interfaces defined in `types.ts` and mock data in `mockData.ts`. You can implement a real-time sync using the Salesforce REST API or Streaming API.

---

## Best Recommendation

**For your situation, I recommend:**

1. **Immediate fix:** Use **Data Loader** (Option 1) for a one-time bulk transfer
2. **Ongoing automation:** Set up **Salesforce Flow** (Option 2) to automatically transfer new contacts
3. **Advanced users:** Use the **API scripts** (Option 3) if you need more control or integration with other systems

The combination of Data Loader for initial cleanup + Salesforce Flow for ongoing automation gives you the best of both worlds without requiring coding skills.

---

## Need Help?

1. Salesforce documentation: https://help.salesforce.com
2. Salesforce Trailhead (free training): https://trailhead.salesforce.com
3. Data Loader guide: https://help.salesforce.com/s/articleView?id=sf.data_loader.htm

If you need admin permissions, work with your Salesforce administrator to:
- Grant "Transfer Record" permission to your profile
- Set up sharing rules to give you access to territory contacts
- Create a report/list view filtered to your territory for easy access
