#!/bin/bash
# eBOS Manager - Deploy Watt (Enterprise Data Intelligence Agent)
# This script deploys Watt as a Cloud Run service with Vertex AI and BigQuery integration

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Check environment variables
check_env() {
    print_status "Checking environment variables..."
    
    required_vars=("GCP_PROJECT_ID" "GCP_REGION" "BIGQUERY_DATASET" "STORAGE_BUCKET")
    missing=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then missing+=("$var"); fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        print_error "Missing environment variables: ${missing[*]}"
        exit 1
    fi
    
    print_status "Environment variables verified ✓"
}

# Initialize BigQuery schema
init_bigquery() {
    print_status "Initializing BigQuery schema..."
    
    bq query --use_legacy_sql=false < bigquery_schema.sql
    
    print_status "BigQuery schema initialized ✓"
}

# Create Watt Cloud Run service code
create_watt_service() {
    print_status "Creating Watt service code..."
    
    cat > main.py <<'EOF'
import os
import json
from flask import Flask, request, jsonify
from google.cloud import bigquery
from google.cloud import aiplatform
import anthropic

app = Flask(__name__)

# Initialize clients
project_id = os.environ.get('GCP_PROJECT_ID')
region = os.environ.get('GCP_REGION', 'us-central1')
dataset = os.environ.get('BIGQUERY_DATASET', 'ebos_manager')

# BigQuery client
bq_client = bigquery.Client(project=project_id)

# Anthropic client for Claude (using Vertex AI)
# Note: In production, use Vertex AI's Claude integration
# For now, we'll use direct Anthropic API with key from Secret Manager
anthropic_client = None  # Will initialize on first use

# Load system prompt
with open('system_prompt.txt', 'r') as f:
    SYSTEM_PROMPT = f.read()

def get_anthropic_client():
    """Initialize Anthropic client (cached)"""
    global anthropic_client
    if anthropic_client is None:
        # In production: get API key from Secret Manager
        api_key = os.environ.get('ANTHROPIC_API_KEY')
        if api_key:
            anthropic_client = anthropic.Anthropic(api_key=api_key)
    return anthropic_client

def execute_sql(sql_query):
    """Execute SQL query against BigQuery"""
    try:
        query_job = bq_client.query(sql_query)
        results = query_job.result()
        
        # Convert to list of dicts
        rows = [dict(row) for row in results]
        return {
            'success': True,
            'rows': rows,
            'row_count': len(rows),
            'total_bytes_processed': query_job.total_bytes_processed
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def chat_with_watt(user_message, conversation_history=None):
    """Process user query with Watt"""
    client = get_anthropic_client()
    if not client:
        return {
            'success': False,
            'error': 'Anthropic client not initialized. Check API key configuration.'
        }
    
    # Build conversation
    messages = conversation_history or []
    messages.append({
        'role': 'user',
        'content': user_message
    })
    
    # Call Claude
    response = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=4000,
        system=SYSTEM_PROMPT,
        messages=messages
    )
    
    # Extract response
    assistant_message = response.content[0].text
    
    # Check if response contains SQL (basic detection)
    if '```sql' in assistant_message or 'SELECT ' in assistant_message:
        # Extract SQL query
        import re
        sql_pattern = r'```sql\n(.*?)\n```'
        match = re.search(sql_pattern, assistant_message, re.DOTALL)
        
        if match:
            sql_query = match.group(1)
            print(f"Executing SQL: {sql_query}")
            
            # Execute query
            query_results = execute_sql(sql_query)
            
            # Add results to conversation for final response
            messages.append({
                'role': 'assistant',
                'content': assistant_message
            })
            
            if query_results['success']:
                messages.append({
                    'role': 'user',
                    'content': f"Query executed successfully. Results:\n{json.dumps(query_results['rows'], indent=2)}\n\nPlease analyze these results and provide insights."
                })
                
                # Get final analysis
                final_response = client.messages.create(
                    model='claude-sonnet-4-20250514',
                    max_tokens=4000,
                    system=SYSTEM_PROMPT,
                    messages=messages
                )
                
                return {
                    'success': True,
                    'message': final_response.content[0].text,
                    'sql_executed': sql_query,
                    'query_results': query_results
                }
            else:
                return {
                    'success': False,
                    'message': assistant_message,
                    'sql_attempted': sql_query,
                    'error': query_results.get('error')
                }
    
    # No SQL query needed, return response directly
    return {
        'success': True,
        'message': assistant_message
    }

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'watt'})

@app.route('/query', methods=['POST'])
def query():
    """Process natural language query"""
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({'error': 'Missing message parameter'}), 400
    
    user_message = data['message']
    conversation_history = data.get('conversation_history', [])
    
    result = chat_with_watt(user_message, conversation_history)
    
    return jsonify(result)

@app.route('/sql', methods=['POST'])
def sql():
    """Execute raw SQL query"""
    data = request.get_json()
    
    if not data or 'query' not in data:
        return jsonify({'error': 'Missing query parameter'}), 400
    
    sql_query = data['query']
    result = execute_sql(sql_query)
    
    return jsonify(result)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
EOF

    print_status "Watt service code created ✓"
}

# Create requirements.txt
create_requirements() {
    print_status "Creating requirements.txt..."
    
    cat > requirements.txt <<EOF
flask==3.0.0
google-cloud-bigquery==3.14.0
google-cloud-aiplatform==1.38.0
anthropic==0.40.0
gunicorn==21.2.0
EOF

    print_status "requirements.txt created ✓"
}

# Create Dockerfile
create_dockerfile() {
    print_status "Creating Dockerfile..."
    
    cat > Dockerfile <<EOF
FROM python:3.11-slim

WORKDIR /app

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY system_prompt.txt .

# Run application
CMD exec gunicorn --bind :\$PORT --workers 1 --threads 8 --timeout 0 main:app
EOF

    print_status "Dockerfile created ✓"
}

# Build and deploy to Cloud Run
deploy_cloud_run() {
    print_status "Building and deploying Watt to Cloud Run..."
    
    SERVICE_NAME="watt"
    
    # Build container image with Cloud Build
    gcloud builds submit --tag gcr.io/${GCP_PROJECT_ID}/${SERVICE_NAME} .
    
    # Deploy to Cloud Run
    gcloud run deploy ${SERVICE_NAME} \
        --image gcr.io/${GCP_PROJECT_ID}/${SERVICE_NAME} \
        --platform managed \
        --region ${GCP_REGION} \
        --service-account watt-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com \
        --set-env-vars "GCP_PROJECT_ID=${GCP_PROJECT_ID},GCP_REGION=${GCP_REGION},BIGQUERY_DATASET=${BIGQUERY_DATASET}" \
        --allow-unauthenticated \
        --memory 2Gi \
        --cpu 2 \
        --timeout 300 \
        --max-instances 10
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${GCP_REGION} --format 'value(status.url)')
    
    print_status "Watt deployed to: ${SERVICE_URL} ✓"
    echo "Service URL: ${SERVICE_URL}" > watt_url.txt
}

# Test deployment
test_deployment() {
    print_status "Testing Watt deployment..."
    
    SERVICE_URL=$(cat watt_url.txt)
    
    # Health check
    print_status "Testing health endpoint..."
    curl -s "${SERVICE_URL}/health" | jq .
    
    print_status "Watt deployment test complete ✓"
}

main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║          Deploying Watt - Data Intelligence Agent         ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_env
    init_bigquery
    create_watt_service
    create_requirements
    create_dockerfile
    deploy_cloud_run
    test_deployment
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║           Watt Deployment Complete! ✓                      ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Watt is now available at: $(cat watt_url.txt)"
    echo ""
    echo "Next steps:"
    echo "  1. Set ANTHROPIC_API_KEY in Secret Manager"
    echo "  2. Test with: curl -X POST \$(cat watt_url.txt)/query -H 'Content-Type: application/json' -d '{\"message\": \"How many systems do we have?\"}'"
    echo "  3. Deploy ANA: cd ../ana && ./deploy_ana.sh"
    echo ""
}

main
