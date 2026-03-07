# eBOS Manager - Vertex AI Deployment Package

Complete deployment infrastructure for the 8-agent eBOS Manager ecosystem on Google Vertex AI.

## 🎯 What This Package Contains

A production-ready deployment structure for:
- **Watt**: Enterprise Data Intelligence (BigQuery + Claude)
- **ANA**: Field Operations Assistant (Claude-powered field support)
- **Integration Layer**: API orchestration and data pipelines
- **6 Additional Agents**: Territory, Customer, Inventory, Performance, Compliance, Competitive (Phase 2-3)

## 📁 Package Structure

```
ebos-manager-deployment/
├── DEPLOYMENT_GUIDE.md         # Complete deployment documentation
├── QUICK_START.md              # Fast-track deployment guide
├── README.md                   # This file
│
├── infrastructure/
│   └── setup_gcp_infrastructure.sh    # One-command GCP setup
│
├── phase1/ (READY TO DEPLOY)
│   ├── watt/                   # Data Intelligence Agent
│   │   ├── deploy_watt.sh      # ✓ Deployment script
│   │   ├── system_prompt.txt   # ✓ AI prompt configuration
│   │   ├── bigquery_schema.sql # ✓ Database schema
│   │   ├── main.py             # (Generated during deployment)
│   │   └── Dockerfile          # (Generated during deployment)
│   │
│   ├── ana/                    # Field Operations Agent
│   │   ├── deploy_ana.sh       # ✓ Deployment script
│   │   ├── system_prompt.txt   # ✓ AI prompt configuration
│   │   ├── main.py             # (Generated during deployment)
│   │   └── Dockerfile          # (Generated during deployment)
│   │
│   └── integration-api/        # Integration Layer (coming next)
│
├── phase2/ (Planned)
│   ├── territory/              # Territory Management Agent
│   ├── customer-engagement/    # Customer Engagement Agent
│   └── inventory/              # Inventory & Logistics Agent
│
├── phase3/ (Planned)
│   ├── performance-monitoring/ # Performance Monitoring Agent
│   ├── compliance/             # Compliance & Regulatory Agent
│   └── competitive-intelligence/ # Competitive Intelligence Agent
│
├── shared/
│   ├── configs/                # Shared configurations
│   ├── prompts/                # Reusable prompt templates
│   └── schemas/                # Data schemas and APIs
│
└── documentation/
    ├── API_DOCUMENTATION.md    # (Coming soon)
    ├── TESTING_GUIDE.md        # (Coming soon)
    └── TROUBLESHOOTING.md      # (Coming soon)
```

## 🚀 Quick Start (5 Steps)

### 1. Set Environment Variables
```bash
export GCP_PROJECT_ID="your-gcp-project-id"
export GCP_REGION="us-central1"
export BIGQUERY_DATASET="ebos_manager"
```

### 2. Initialize Infrastructure
```bash
cd infrastructure
./setup_gcp_infrastructure.sh
```

### 3. Store Anthropic API Key
```bash
echo -n "your-anthropic-api-key" | \
  gcloud secrets create anthropic-api-key --data-file=- --replication-policy="automatic"
```

### 4. Deploy Watt (Data Intelligence)
```bash
cd phase1/watt
./deploy_watt.sh
```

### 5. Deploy ANA (Field Operations)
```bash
cd ../ana
./deploy_ana.sh
```

**Done!** Your first two agents are live.

## 📋 Prerequisites

### Required Tools
- Google Cloud SDK (`gcloud` CLI)
- BigQuery CLI (`bq`)
- Docker Desktop (for local testing)
- `curl` and `jq` (for API testing)

### Google Cloud Requirements
- GCP Project with billing enabled
- Owner or Editor role
- APIs enabled (done automatically by setup script):
  - Vertex AI
  - BigQuery
  - Cloud Run
  - Secret Manager
  - Cloud Build

### API Keys
- Anthropic API key (for Claude access)
  - Get from: https://console.anthropic.com
  - Free tier available for testing
  - Production: pay-as-you-go pricing

## 💡 What Each Agent Does

### Phase 1 Agents (Ready Now)

**Watt - Enterprise Data Intelligence**
- Natural language queries to BigQuery
- SQL generation from business questions
- Performance analytics and forecasting
- Win/loss analysis and competitive insights
- Regional performance comparisons

**ANA - Field Operations Assistant**
- Real-time commissioning guidance
- Troubleshooting diagnostics (fault codes)
- Step-by-step procedures
- Safety protocols and compliance
- Regional-specific environmental factors

**Integration/API Layer** (Coming next)
- Connects all agents together
- Manages data flow to/from external systems
- ServiceTitan, Salesforce, BMS integrations
- API security and authentication

### Phase 2 Agents (Weeks 4-12)

- **Territory Management**: Scheduling optimization across 4 regions
- **Customer Engagement**: Training, warranty, satisfaction tracking
- **Inventory & Logistics**: Parts management and supply chain

### Phase 3 Agents (Weeks 12-24)

- **Performance Monitoring**: Predictive maintenance and alerting
- **Compliance & Regulatory**: Certification and safety tracking
- **Competitive Intelligence**: Win/loss analysis and market positioning

## 🎯 Use Cases

### For Field Technicians (ANA)
```bash
# Get commissioning checklist
curl -X POST https://ana-service.run.app/commissioning \
  -H "Content-Type: application/json" \
  -d '{"model": "60kW", "region": "West", "phase": "pre-commissioning"}'

# Troubleshoot fault code
curl -X POST https://ana-service.run.app/troubleshoot \
  -H "Content-Type: application/json" \
  -d '{"fault_code": "E001", "model": "60kW", "symptoms": "Engine cranks but won't start"}'
```

### For Director/Management (Watt)
```bash
# Ask business questions in natural language
curl -X POST https://watt-service.run.app/query \
  -H "Content-Type: application/json" \
  -d '{"message": "What's our win rate against Atlas Copco in the West region over the last 6 months?"}'

# Get regional performance comparison
curl -X POST https://watt-service.run.app/query \
  -H "Content-Type: application/json" \
  -d '{"message": "Compare commissioning efficiency across all regions"}'
```

## 💰 Cost Estimates

### Phase 1 Monthly Costs
| Service | Estimated Cost |
|---------|---------------|
| Vertex AI (Claude API) | $500-1,500/mo |
| BigQuery (storage + queries) | $100-300/mo |
| Cloud Run (compute) | $50-200/mo |
| Cloud Storage | $10-50/mo |
| **Total Phase 1** | **$700-2,000/mo** |

*Costs vary with usage volume. Monitor via Google Cloud Billing.*

## 🔒 Security Features

- **API Keys**: Stored in Google Secret Manager (never in code)
- **Encryption**: 
  - At rest: Google-managed encryption
  - In transit: TLS 1.3+
- **Authentication**: Service accounts with least-privilege IAM
- **Audit Logging**: All access logged in Cloud Logging
- **Compliance**: HIPAA-ready, SOC 2 considerations

## 📊 Success Metrics

### Phase 1 Targets
- **Watt Response Time**: <2 seconds for queries
- **ANA Accuracy**: 95%+ helpful guidance rate
- **System Uptime**: 99.9% availability
- **Cost per Query**: <$0.10 average

### Pilot Success Criteria
- D-dub (West Region) satisfaction: 4.5+/5.0
- Reduction in commissioning time: 10%+
- Reduction in troubleshooting calls: 15%+

## 🐛 Troubleshooting

### Common Issues

**"Permission denied" errors**
```bash
# Verify your role
gcloud projects get-iam-policy ${GCP_PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:$(gcloud config get-value account)"
```

**"API not enabled" errors**
```bash
# Re-run infrastructure setup
cd infrastructure
./setup_gcp_infrastructure.sh
```

**"Service account not found"**
```bash
# List service accounts
gcloud iam service-accounts list
```

**Deployment fails during Cloud Build**
```bash
# Check Cloud Build logs
gcloud builds list --limit=5
gcloud builds log [BUILD_ID]
```

## 📚 Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment walkthrough
- **[QUICK_START.md](./QUICK_START.md)** - Fast-track deployment guide
- **[Original Agent Specification](../path/to/original/doc)** - Full agent ecosystem design

## 🤝 Support

### Getting Help
1. Review TROUBLESHOOTING.md (coming soon)
2. Check Google Cloud documentation
3. Review logs: `gcloud logging read --limit=50`

### Escalation Path
- Level 1: Check deployment logs and documentation
- Level 2: Google Cloud Support (if on support plan)
- Level 3: Anthropic Support (for Claude API issues)

## 🗺️ Roadmap

### ✅ Complete
- Infrastructure setup automation
- Watt deployment (Data Intelligence)
- ANA deployment (Field Operations)
- BigQuery schema design
- System prompts and configurations

### 🚧 In Progress
- Integration/API layer deployment
- Sample data loading scripts
- Testing and validation framework

### 📅 Planned
- Phase 2 agents (Territory, Customer, Inventory)
- Phase 3 agents (Performance, Compliance, Competitive)
- Mobile app for field technicians
- Dashboard and reporting UI

## 📄 License

Internal use only - EnergyBoss Applications Support

## 👥 Team

- **Director**: Bryan Mack
- **West Region Lead**: D-dub / Devon Warren
- **North Region**: Frank Walker
- **East Region**: John Thomas
- **South Region**: Mitchell Oliver

---

## 🎉 Ready to Deploy?

1. **Read**: [QUICK_START.md](./QUICK_START.md) for step-by-step instructions
2. **Deploy**: Follow the 5-step quick start above
3. **Test**: Run sample queries against Watt and ANA
4. **Pilot**: 2-week trial with West Region (D-dub)
5. **Scale**: Roll out to all 4 regions

**Questions?** Review the full [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

*Last Updated: January 30, 2026*  
*Package Version: 1.0*  
*Status: Phase 1 Ready for Deployment*
