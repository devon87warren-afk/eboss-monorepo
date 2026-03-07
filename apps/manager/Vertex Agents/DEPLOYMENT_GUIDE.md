# eBOS Manager - Vertex AI Deployment Guide

## Overview
This guide walks through deploying the complete 8-agent eBOS Manager ecosystem to Google Vertex AI.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                VERTEX AI PLATFORM                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │   WATT (Claude + BigQuery)               │          │
│  │   - Natural language queries             │          │
│  │   - SQL generation                       │          │
│  │   - Analytics hub                        │          │
│  └──────────────┬───────────────────────────┘          │
│                 │                                        │
│  ┌──────────────┴───────────────────────────┐          │
│  │   Agent Layer (Cloud Run Services)       │          │
│  ├──────────────────────────────────────────┤          │
│  │  • ANA (Field Ops - Claude)              │          │
│  │  • Territory Mgmt (Python + Optimization)│          │
│  │  • Customer Engagement (Claude + Python) │          │
│  │  • Competitive Intel (Python + Watt)     │          │
│  │  • Inventory (Python + ERP)              │          │
│  │  • Compliance (Python + Database)        │          │
│  │  • Performance Monitor (Python + ML)     │          │
│  │  • Integration/API (Python + Pipelines)  │          │
│  └──────────────────────────────────────────┘          │
│                                                          │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   External Integrations       │
        ├───────────────────────────────┤
        │  • ServiceTitan (Scheduling)  │
        │  • Salesforce (CRM)           │
        │  • eBoss Units (Telemetry)    │
        │  • Supplier APIs              │
        └───────────────────────────────┘
```

## Prerequisites

### 1. Google Cloud Setup
- [ ] Google Cloud project created
- [ ] Billing enabled
- [ ] Vertex AI API enabled
- [ ] BigQuery API enabled
- [ ] Cloud Run API enabled
- [ ] Secret Manager API enabled
- [ ] Cloud Storage bucket created

### 2. Access & Permissions
- [ ] Owner or Editor role on GCP project
- [ ] Vertex AI User role
- [ ] BigQuery Admin role
- [ ] Cloud Run Admin role
- [ ] Secret Manager Admin role

### 3. External System Access
- [ ] ServiceTitan API credentials
- [ ] Salesforce API credentials
- [ ] eBoss telemetry system access
- [ ] Supplier API credentials (if applicable)

## Deployment Phases

### Phase 1: Foundation (Weeks 1-4) - IMMEDIATE
**Components:**
- Watt (Enterprise Data Intelligence)
- ANA (Field Operations Agent)
- Integration/API Foundation

**Status:** Ready to deploy
**Est. Time:** 2-3 days setup + 1-2 weeks testing

### Phase 2: Core Operations (Weeks 4-12)
**Components:**
- Territory Management Agent
- Customer Engagement Agent
- Inventory & Logistics Agent

**Status:** Pending Phase 1 completion
**Est. Time:** 4-6 weeks

### Phase 3: Analytics & Monitoring (Weeks 12-24)
**Components:**
- Performance Monitoring & Alerting
- Compliance & Regulatory
- Competitive Intelligence

**Status:** Pending Phase 2 completion
**Est. Time:** 8-10 weeks

## Quick Start - Phase 1 Deployment

### Step 1: Set Environment Variables
```bash
export GCP_PROJECT_ID="your-project-id"
export GCP_REGION="us-central1"
export BIGQUERY_DATASET="ebos_manager"
export VERTEX_AI_MODEL="claude-3-5-sonnet@20241022"  # or latest
```

### Step 2: Initialize Infrastructure
```bash
cd infrastructure
./setup_gcp_infrastructure.sh
```

### Step 3: Deploy Watt
```bash
cd phase1/watt
./deploy_watt.sh
```

### Step 4: Deploy ANA
```bash
cd phase1/ana
./deploy_ana.sh
```

### Step 5: Deploy Integration Layer
```bash
cd phase1/integration-api
./deploy_integration.sh
```

### Step 6: Verify Deployment
```bash
./verify_phase1.sh
```

## Deployment Files Structure

```
ebos-manager-deployment/
├── DEPLOYMENT_GUIDE.md (this file)
├── infrastructure/
│   ├── setup_gcp_infrastructure.sh
│   ├── terraform/ (optional: IaC)
│   └── vertex_ai_config.yaml
├── phase1/
│   ├── watt/
│   │   ├── deploy_watt.sh
│   │   ├── watt_config.yaml
│   │   ├── system_prompt.txt
│   │   └── bigquery_schema.sql
│   ├── ana/
│   │   ├── deploy_ana.sh
│   │   ├── ana_config.yaml
│   │   ├── system_prompt.txt
│   │   └── knowledge_base/
│   └── integration-api/
│       ├── deploy_integration.sh
│       ├── main.py
│       ├── requirements.txt
│       └── Dockerfile
├── phase2/ (Territory, Customer, Inventory)
├── phase3/ (Performance, Compliance, Competitive)
├── shared/
│   ├── configs/
│   ├── prompts/
│   └── schemas/
└── documentation/
    ├── API_DOCUMENTATION.md
    ├── TESTING_GUIDE.md
    └── TROUBLESHOOTING.md
```

## Cost Estimation

### Phase 1 Monthly Costs (Estimated)
- Vertex AI (Claude calls): $500-1,500/month
- BigQuery: $100-300/month
- Cloud Run: $50-200/month
- Cloud Storage: $10-50/month
- **Total Phase 1:** ~$700-2,000/month

### Full Deployment (All Phases)
- **Total Estimated:** ~$2,000-5,000/month

*Costs scale with usage. Adjust based on actual call volume.*

## Security Considerations

1. **API Keys & Secrets**
   - Store in Google Secret Manager
   - Rotate every 90 days
   - Never commit to version control

2. **Data Encryption**
   - At rest: Google-managed encryption
   - In transit: TLS 1.3+
   - Customer data: Additional AES-256 encryption

3. **Access Control**
   - IAM roles with least privilege
   - Service accounts per component
   - Audit logging enabled

4. **Compliance**
   - HIPAA compliance (if healthcare customers)
   - SOC 2 compliance considerations
   - Regional data residency requirements

## Testing Strategy

### Unit Testing
- Each agent tested independently
- Mock external integrations
- Test system prompts with sample queries

### Integration Testing
- Test inter-agent communication
- Validate data flow through Watt
- Test external API integrations

### User Acceptance Testing
- Pilot with D-dub (West Region)
- 2-week trial period
- Gather feedback and iterate

## Monitoring & Alerting

### Key Metrics to Track
- Agent response time (<2 seconds target)
- API uptime (99.9% target)
- Error rate (<0.1% target)
- BigQuery query performance
- Cloud Run instance utilization

### Alerting Rules
- Agent down >5 minutes: Page on-call
- Error rate >1%: Alert team
- Response time >5 seconds: Investigation
- Cost anomaly >20%: Budget alert

## Rollback Plan

Each phase has rollback capability:
1. Tag each deployment with version
2. Keep previous version running during testing
3. Blue/green deployment for zero downtime
4. Automated rollback on critical errors

## Support & Escalation

### Technical Issues
- Level 1: Check logs in Cloud Logging
- Level 2: Review monitoring dashboards
- Level 3: Contact Google Cloud Support

### Business Issues
- Agent performance issues: Review prompts
- Data quality issues: Check integration layer
- Cost overruns: Review usage patterns

## Next Steps

1. Complete Phase 1 deployment
2. Conduct 2-week pilot with D-dub
3. Gather feedback and iterate
4. Go/No-Go decision for Phase 2
5. Expand to all regions

## Additional Resources

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Best Practices for LLM Applications](https://cloud.google.com/vertex-ai/docs/generative-ai/learn/best-practices)

---

**Document Version:** 1.0  
**Created:** January 30, 2026  
**Status:** Ready for Phase 1 Deployment
