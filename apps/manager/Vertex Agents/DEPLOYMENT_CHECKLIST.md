# eBOS Manager Deployment Checklist

Track your deployment progress with this checklist.

## Pre-Deployment Setup

### Google Cloud Account Setup
- [ ] GCP project created
- [ ] Project ID noted: `_______________________`
- [ ] Billing enabled and verified
- [ ] Owner or Editor role confirmed
- [ ] gcloud CLI installed locally
- [ ] Authenticated: `gcloud auth login` completed

### API Keys Obtained
- [ ] Anthropic API key obtained from https://console.anthropic.com
- [ ] API key securely stored (NOT committed to git)

### Environment Variables Set
```bash
- [ ] export GCP_PROJECT_ID="your-project-id"
- [ ] export GCP_REGION="us-central1"
- [ ] export BIGQUERY_DATASET="ebos_manager"
```

---

## Phase 1: Infrastructure Setup

### Step 1: Initialize GCP Infrastructure
```bash
cd infrastructure
./setup_gcp_infrastructure.sh
```

- [ ] Script executed successfully
- [ ] BigQuery dataset created: `ebos_manager`
- [ ] Cloud Storage bucket created: `${PROJECT_ID}-ebos-manager`
- [ ] Service accounts created:
  - [ ] watt-sa@${PROJECT_ID}.iam.gserviceaccount.com
  - [ ] ana-sa@${PROJECT_ID}.iam.gserviceaccount.com
  - [ ] integration-sa@${PROJECT_ID}.iam.gserviceaccount.com
- [ ] IAM roles assigned correctly
- [ ] All required APIs enabled

**Completion Time**: _______  
**Issues Encountered**: _______________________

---

### Step 2: Store API Keys in Secret Manager
```bash
echo -n "YOUR_API_KEY" | gcloud secrets create anthropic-api-key --data-file=- --replication-policy="automatic"
gcloud secrets add-iam-policy-binding anthropic-api-key \
  --member="serviceAccount:watt-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

- [ ] Anthropic API key stored in Secret Manager
- [ ] IAM permissions granted to service accounts
- [ ] Secret accessible: `gcloud secrets versions access latest --secret=anthropic-api-key` (test)

**Completion Time**: _______

---

## Phase 1A: Deploy Watt (Data Intelligence)

### Step 3: Deploy Watt
```bash
cd phase1/watt
./deploy_watt.sh
```

- [ ] BigQuery schema initialized
- [ ] Docker image built successfully
- [ ] Cloud Run service deployed
- [ ] Health check passed: `curl ${WATT_URL}/health`
- [ ] Service URL noted: `_______________________`

**Completion Time**: _______  
**Watt Service URL**: _______________________

### Step 4: Test Watt
```bash
# Test health
curl "${WATT_URL}/health"

# Test query (after loading sample data)
curl -X POST "${WATT_URL}/query" \
  -H "Content-Type: application/json" \
  -d '{"message": "How many systems do we have?"}'
```

- [ ] Health endpoint responds correctly
- [ ] Query endpoint functional
- [ ] Response time acceptable (<5 seconds)
- [ ] No errors in Cloud Logging

**Test Results**: _______________________

---

## Phase 1B: Deploy ANA (Field Operations)

### Step 5: Deploy ANA
```bash
cd phase1/ana
./deploy_ana.sh
```

- [ ] Docker image built successfully
- [ ] Cloud Run service deployed
- [ ] Health check passed: `curl ${ANA_URL}/health`
- [ ] Service URL noted: `_______________________`

**Completion Time**: _______  
**ANA Service URL**: _______________________

### Step 6: Test ANA
```bash
# Test commissioning endpoint
curl -X POST "${ANA_URL}/commissioning" \
  -H "Content-Type: application/json" \
  -d '{"model": "60kW", "region": "West", "phase": "pre-commissioning"}'

# Test troubleshooting endpoint
curl -X POST "${ANA_URL}/troubleshoot" \
  -H "Content-Type: application/json" \
  -d '{"fault_code": "E001", "model": "60kW"}'
```

- [ ] Health endpoint responds correctly
- [ ] Commissioning endpoint functional
- [ ] Troubleshooting endpoint functional
- [ ] Response quality acceptable
- [ ] No errors in Cloud Logging

**Test Results**: _______________________

---

## Phase 1C: Load Sample Data (Optional)

### Step 7: Populate BigQuery with Test Data
```bash
# Load sample systems, customers, commissioning records
bq load --source_format=CSV ebos_manager.systems gs://sample-data/systems.csv
```

- [ ] Sample data script created
- [ ] Data loaded into BigQuery tables:
  - [ ] systems
  - [ ] customers
  - [ ] commissioning_records
  - [ ] performance_metrics
  - [ ] work_orders
- [ ] Watt queries return meaningful results

**Sample Data Rows Loaded**: _______

---

## Phase 1 Validation & Go/No-Go

### Step 8: Pilot Testing (2 Weeks)
**Pilot User**: D-dub / Devon Warren (West Region)

**Week 1 Testing**
- [ ] D-dub trained on Watt usage
- [ ] D-dub trained on ANA usage
- [ ] At least 5 real queries submitted to Watt
- [ ] At least 5 real queries submitted to ANA
- [ ] Feedback collected daily
- [ ] Issues logged and tracked

**Week 1 Feedback**: _______________________

**Week 2 Testing**
- [ ] D-dub using agents without guidance
- [ ] Performance metrics tracked:
  - [ ] Query response time
  - [ ] Accuracy of responses
  - [ ] User satisfaction (1-5 scale): _______
- [ ] Edge cases identified and tested
- [ ] Iteration on prompts if needed

**Week 2 Feedback**: _______________________

### Step 9: Go/No-Go Decision
**Decision Date**: _______

**Success Criteria** (Must meet 4/5):
- [ ] User satisfaction ≥ 4.0/5.0
- [ ] Query response time < 5 seconds (90th percentile)
- [ ] Accuracy rate ≥ 90%
- [ ] Zero critical bugs
- [ ] Cost within budget (<$1,000 for 2-week pilot)

**Decision**: [ ] GO  [ ] NO-GO

**Decision Rationale**: _______________________

---

## Phase 2: Deploy Core Operations Agents (If GO)

### Territory Management Agent
- [ ] Deployment script created
- [ ] ServiceTitan integration configured
- [ ] Deployed to Cloud Run
- [ ] Tested with sample scheduling data

**Completion Date**: _______

### Customer Engagement Agent
- [ ] Deployment script created
- [ ] CRM integration configured
- [ ] Deployed to Cloud Run
- [ ] Tested with sample customer interactions

**Completion Date**: _______

### Inventory & Logistics Agent
- [ ] Deployment script created
- [ ] ERP integration configured
- [ ] Deployed to Cloud Run
- [ ] Tested with sample parts requests

**Completion Date**: _______

---

## Phase 3: Deploy Analytics & Monitoring Agents

### Performance Monitoring Agent
- [ ] Deployment script created
- [ ] Telemetry integration configured
- [ ] Alert routing setup
- [ ] Deployed and tested

**Completion Date**: _______

### Compliance & Regulatory Agent
- [ ] Deployment script created
- [ ] Regulatory database loaded
- [ ] Deployed and tested

**Completion Date**: _______

### Competitive Intelligence Agent
- [ ] Deployment script created
- [ ] Win/loss data imported
- [ ] Deployed and tested

**Completion Date**: _______

---

## Production Readiness

### Security Checklist
- [ ] All API keys in Secret Manager
- [ ] No secrets in source code
- [ ] IAM roles reviewed (least privilege)
- [ ] Audit logging enabled
- [ ] Encryption verified (at rest + in transit)

### Monitoring & Alerting
- [ ] Cloud Monitoring dashboards created
- [ ] Uptime checks configured
- [ ] Cost alerts set (>$2,000/month)
- [ ] Error rate alerts configured
- [ ] On-call rotation established

### Documentation
- [ ] API documentation complete
- [ ] User guides for all 4 regions
- [ ] Troubleshooting guide published
- [ ] Escalation procedures documented

### Training
- [ ] All 4 technicians trained on agents
- [ ] Director (Bryan Mack) trained on Watt analytics
- [ ] Sales team trained on competitive intelligence
- [ ] Support team trained on troubleshooting

---

## Rollout to All Regions

### West Region (D-dub)
- [x] Pilot complete
- [ ] Full deployment
- [ ] User satisfaction: _______

### North Region (Frank)
- [ ] Training complete
- [ ] Deployment
- [ ] User satisfaction: _______

### East Region (John)
- [ ] Training complete
- [ ] Deployment
- [ ] User satisfaction: _______

### South Region (Mitchell)
- [ ] Training complete
- [ ] Deployment
- [ ] User satisfaction: _______

---

## Success Metrics (3 Months Post-Deployment)

**Operational Metrics**
- [ ] Technician utilization improved by _____%
- [ ] Commissioning time reduced by _____%
- [ ] Customer satisfaction increased to _______/5.0
- [ ] Troubleshooting calls reduced by _____%

**Financial Metrics**
- [ ] Total monthly cost: $_______ (budget: <$5,000)
- [ ] Cost per technician: $_______ (budget: <$1,250)
- [ ] ROI calculation: _______

**Quality Metrics**
- [ ] System uptime: _______% (target: 99.9%)
- [ ] Query accuracy: _______% (target: 95%)
- [ ] User satisfaction: _______/5.0 (target: 4.5+)

---

## Notes & Lessons Learned

**What Went Well**:


**What Could Be Improved**:


**Recommendations for Future Deployments**:


---

*Deployment Lead*: _______________________  
*Start Date*: _______________________  
*Phase 1 Complete Date*: _______________________  
*Full Deployment Date*: _______________________
