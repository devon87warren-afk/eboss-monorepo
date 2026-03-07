# eBOS Manager - Quick Start Deployment Guide

## What We've Created

A complete Vertex AI deployment structure for the 8-agent eBOS Manager ecosystem with:
- **Phase 1 (Immediate)**: Watt + ANA + Integration foundation
- **Phase 2 (Weeks 4-12)**: Territory, Customer Engagement, Inventory
- **Phase 3 (Weeks 12-24)**: Performance Monitoring, Compliance, Competitive Intelligence

## Directory Structure Created

```
/home/claude/ebos-manager-deployment/
├── DEPLOYMENT_GUIDE.md              # Complete deployment documentation
├── infrastructure/
│   └── setup_gcp_infrastructure.sh  # GCP initialization script
├── phase1/
│   ├── watt/
│   │   ├── deploy_watt.sh          # Watt deployment script
│   │   ├── system_prompt.txt       # Watt AI prompt
│   │   └── bigquery_schema.sql     # Database schema
│   ├── ana/                        # (Next: ANA field operations)
│   └── integration-api/            # (Next: Integration layer)
├── phase2/                         # Territory, Customer, Inventory agents
├── phase3/                         # Monitoring, Compliance, Competitive
├── shared/
│   ├── configs/
│   ├── prompts/
│   └── schemas/
└── documentation/
```

## Prerequisites - What You Need

### 1. Google Cloud Account
- [ ] GCP project created
- [ ] Billing enabled  
- [ ] Owner or Editor role

### 2. Tools Installed Locally
- [ ] `gcloud` CLI (Google Cloud SDK)
- [ ] `bq` CLI (BigQuery command-line tool)
- [ ] `docker` (for building containers)

### 3. API Keys
- [ ] Anthropic API key (for Claude access)
  - Get from: https://console.anthropic.com
  - Will be stored in Google Secret Manager

## Step-by-Step Deployment (Phase 1)

### Step 1: Set Environment Variables

```bash
export GCP_PROJECT_ID="your-project-id-here"
export GCP_REGION="us-central1"
export BIGQUERY_DATASET="ebos_manager"

# These will be set by the infrastructure script:
# export STORAGE_BUCKET="${GCP_PROJECT_ID}-ebos-manager"
```

### Step 2: Authenticate with Google Cloud

```bash
gcloud auth login
gcloud config set project ${GCP_PROJECT_ID}
```

### Step 3: Initialize Infrastructure

```bash
cd /home/claude/ebos-manager-deployment
cd infrastructure
./setup_gcp_infrastructure.sh
```

This creates:
- BigQuery dataset
- Cloud Storage bucket  
- Service accounts (watt-sa, ana-sa, integration-sa)
- IAM permissions
- Enables all required APIs

**Expected time:** 5-10 minutes

### Step 4: Store Anthropic API Key

```bash
# Create secret in Secret Manager
echo -n "your-anthropic-api-key-here" | \
  gcloud secrets create anthropic-api-key --data-file=- --replication-policy="automatic"

# Grant access to Watt service account
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:watt-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 5: Deploy Watt (Data Intelligence)

```bash
cd ../phase1/watt
./deploy_watt.sh
```

This will:
1. Initialize BigQuery tables
2. Create Cloud Run service
3. Build and deploy Docker container
4. Test health endpoint

**Expected time:** 10-15 minutes

### Step 6: Test Watt

```bash
# Get the service URL
WATT_URL=$(cat watt_url.txt)

# Test health
curl "${WATT_URL}/health"

# Test query (once you have data)
curl -X POST "${WATT_URL}/query" \
  -H "Content-Type: application/json" \
  -d '{"message": "How many eBoss systems do we have by region?"}'
```

### Step 7: Deploy ANA (Field Operations)

```bash
cd ../ana
./deploy_ana.sh  # Coming next
```

### Step 8: Deploy Integration Layer

```bash
cd ../integration-api
./deploy_integration.sh  # Coming next
```

## What Happens After Phase 1

1. **Testing Period (2 weeks)**
   - Pilot with D-dub (West Region)
   - Gather feedback
   - Iterate on prompts and functionality

2. **Go/No-Go Decision**
   - Evaluate Phase 1 success
   - Decide whether to proceed to Phase 2

3. **Phase 2 Deployment**
   - Territory Management Agent
   - Customer Engagement Agent
   - Inventory & Logistics Agent

## Estimated Costs

### Phase 1 Monthly Costs
- Vertex AI (Claude API calls): $500-1,500/mo
- BigQuery storage + queries: $100-300/mo
- Cloud Run instances: $50-200/mo
- Cloud Storage: $10-50/mo
- **Total Phase 1:** ~$700-2,000/mo

Costs scale with usage. Monitor with Google Cloud Billing alerts.

## Troubleshooting

### Error: "Permission denied"
**Solution:** Ensure you have Owner/Editor role:
```bash
gcloud projects get-iam-policy ${GCP_PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR_EMAIL"
```

### Error: "API not enabled"
**Solution:** Enable required APIs:
```bash
gcloud services enable aiplatform.googleapis.com bigquery.googleapis.com run.googleapis.com
```

### Error: "Service account not found"
**Solution:** Verify service accounts were created:
```bash
gcloud iam service-accounts list
```

### Error: "Anthropic API key not found"
**Solution:** Verify secret was created:
```bash
gcloud secrets list
gcloud secrets versions access latest --secret="anthropic-api-key"
```

## Next Steps

1. **Complete Phase 1 deployment** (Watt + ANA + Integration)
2. **Load sample data** into BigQuery
3. **Test with real scenarios** from your eBoss operations
4. **Gather feedback** from technicians
5. **Iterate and improve** prompts and functionality
6. **Proceed to Phase 2** after validation

## Support Resources

- **GCP Documentation:** https://cloud.google.com/docs
- **Vertex AI:** https://cloud.google.com/vertex-ai/docs
- **BigQuery:** https://cloud.google.com/bigquery/docs
- **Cloud Run:** https://cloud.google.com/run/docs
- **Anthropic Claude:** https://docs.anthropic.com

## Files to Review Before Deploying

1. **DEPLOYMENT_GUIDE.md** - Complete deployment documentation
2. **phase1/watt/system_prompt.txt** - Watt's AI prompt (customize if needed)
3. **phase1/watt/bigquery_schema.sql** - Database schema (review tables)
4. **infrastructure/setup_gcp_infrastructure.sh** - Infrastructure setup

## Important Notes

- **Security:** All API keys stored in Secret Manager (never in code)
- **Costs:** Monitor billing closely, especially Vertex AI usage
- **Data Privacy:** Customer data encrypted at rest and in transit
- **Compliance:** Review for HIPAA, SOC 2 requirements if applicable
- **Backups:** BigQuery has automatic backups, but plan for disaster recovery

---

**Ready to deploy?** Start with Step 1 above!

**Questions?** Review the full DEPLOYMENT_GUIDE.md for detailed information.
