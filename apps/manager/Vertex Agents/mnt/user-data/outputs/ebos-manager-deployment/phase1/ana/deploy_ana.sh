#!/bin/bash
# eBOS Manager - Deploy ANA (Field Operations Agent)  
# This script deploys ANA as a Cloud Run service with Vertex AI integration

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
    
    required_vars=("GCP_PROJECT_ID" "GCP_REGION")
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

# Create ANA Cloud Run service code
create_ana_service() {
    print_status "Creating ANA service code..."
    
    cat > main.py <<'EOF'
import os
import json
import googlemaps
from flask import Flask, request, jsonify
from google.cloud import aiplatform
import anthropic

app = Flask(__name__)

# Initialize
project_id = os.environ.get('GCP_PROJECT_ID')
region = os.environ.get('GCP_REGION', 'us-central1')

# Clients
anthropic_client = None
gmaps_client = None

# Load system prompt
with open('system_prompt.txt', 'r') as f:
    SYSTEM_PROMPT = f.read()

def get_anthropic_client():
    """Initialize Anthropic client (cached)"""
    global anthropic_client
    if anthropic_client is None:
        api_key = os.environ.get('ANTHROPIC_API_KEY')
        if api_key:
            anthropic_client = anthropic.Anthropic(api_key=api_key)
    return anthropic_client

def get_gmaps_client():
    """Initialize Google Maps client (cached)"""
    global gmaps_client
    if gmaps_client is None:
        api_key = os.environ.get('GOOGLE_MAPS_API_KEY')
        if api_key:
            gmaps_client = googlemaps.Client(key=api_key)
    return gmaps_client

# -- Tools --

def search_places(query):
    """Search for places using Google Maps."""
    gmaps = get_gmaps_client()
    if not gmaps:
        return "Google Maps API key not configured."
    
    try:
        # Text search for places
        results = gmaps.places(query=query)
        if results.get('status') == 'OK':
            places = []
            for result in results.get('results', [])[:5]:
                places.append({
                    'name': result.get('name'),
                    'address': result.get('formatted_address'),
                    'rating': result.get('rating'),
                    'place_id': result.get('place_id')
                })
            return json.dumps(places)
        return "No results found."
    except Exception as e:
        return f"Error searching places: {str(e)}"

def get_distance(origin, destination, mode="driving"):
    """Get distance and time between two locations."""
    gmaps = get_gmaps_client()
    if not gmaps:
        return "Google Maps API key not configured."
        
    try:
        matrix = gmaps.distance_matrix(origins=[origin], destinations=[destination], mode=mode)
        if matrix.get('status') == 'OK':
            element = matrix['rows'][0]['elements'][0]
            if element.get('status') == 'OK':
                return json.dumps({
                    'distance': element['distance']['text'],
                    'duration': element['duration']['text'],
                    'origin': matrix['origin_addresses'][0],
                    'destination': matrix['destination_addresses'][0]
                })
            return "Route not found."
        return "Error calculation distance."
    except Exception as e:
        return f"Error calculating distance: {str(e)}"

tools = [
    {
        "name": "search_places",
        "description": "Search for places, businesses, or locations using Google Maps. Use this to find suppliers, customer locations, or amenities.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query (e.g. 'hardware stores in San Francisco', '123 Main St')"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_distance",
        "description": "Calculate distance and travel time between two locations. Useful for estimating arrival times or planning routes.",
        "input_schema": {
            "type": "object",
            "properties": {
                "origin": {
                    "type": "string",
                    "description": "Starting point address or name"
                },
                "destination": {
                    "type": "string",
                    "description": "Destination address or name"
                },
                "mode": {
                    "type": "string",
                    "enum": ["driving", "walking", "bicycling", "transit"],
                    "description": "Travel mode (default: driving)"
                }
            },
            "required": ["origin", "destination"]
        }
    }
]

def process_tool_use(tool_use):
    """Execute a tool call and return the result."""
    name = tool_use.name
    tool_input = tool_use.input
    
    if name == "search_places":
        return search_places(tool_input.get("query"))
    elif name == "get_distance":
        return get_distance(
            tool_input.get("origin"),
            tool_input.get("destination"),
            tool_input.get("mode", "driving")
        )
    return "Unknown tool"

def chat_with_ana(user_message, conversation_history=None, context=None):
    """Process field technician query with ANA"""
    client = get_anthropic_client()
    if not client:
        return {
            'success': False,
            'error': 'Anthropic client not initialized. Check API key configuration.'
        }
    
    # Build conversation
    messages = conversation_history or []
    
    # Add context if provided
    if context:
        context_str = "Current context:\n"
        for key, value in context.items():
            context_str += f"- {key}: {value}\n"
        user_message = f"{context_str}\n{user_message}"
    
    messages.append({
        'role': 'user',
        'content': user_message
    })
    
    # First turn
    response = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=4000,
        system=SYSTEM_PROMPT,
        messages=messages,
        tools=tools
    )
    
    # Handle tool usage loop
    while response.stop_reason == "tool_use":
        # Append the assistant's tool use request to history
        messages.append({
            "role": "assistant",
            "content": response.content
        })
        
        # Execute tools
        tool_results = []
        for content_block in response.content:
            if content_block.type == "tool_use":
                result = process_tool_use(content_block)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": content_block.id,
                    "content": str(result)
                })
        
        # Append tool results to history
        messages.append({
            "role": "user",
            "content": tool_results
        })
        
        # Get next response
        response = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=4000,
            system=SYSTEM_PROMPT,
            messages=messages,
            tools=tools
        )
    
    assistant_message = ""
    for block in response.content:
        if block.type == "text":
            assistant_message += block.text
    
    return {
        'success': True,
        'message': assistant_message,
        'usage': {
            'input_tokens': response.usage.input_tokens,
            'output_tokens': response.usage.output_tokens
        }
    }

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'ana'})

@app.route('/assist', methods=['POST'])
def assist():
    """Provide field assistance to technician"""
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({'error': 'Missing message parameter'}), 400
    
    user_message = data['message']
    conversation_history = data.get('conversation_history', [])
    context = data.get('context', {})
    
    result = chat_with_ana(user_message, conversation_history, context)
    
    return jsonify(result)

@app.route('/commissioning', methods=['POST'])
def commissioning():
    """Get commissioning checklist and guidance"""
    data = request.get_json()
    
    model = data.get('model', '60kW')
    region = data.get('region', 'West')
    phase = data.get('phase', 'pre-commissioning')
    
    query = f"I'm about to commission a {model} eBoss system in the {region} region. I'm at the {phase} phase. What should I check?"
    
    result = chat_with_ana(query, context={'model': model, 'region': region})
    
    return jsonify(result)

@app.route('/troubleshoot', methods=['POST'])
def troubleshoot():
    """Get troubleshooting guidance"""
    data = request.get_json()
    
    if not data or 'fault_code' not in data:
        return jsonify({'error': 'Missing fault_code parameter'}), 400
    
    fault_code = data['fault_code']
    model = data.get('model', '60kW')
    symptoms = data.get('symptoms', '')
    
    query = f"I have fault code {fault_code} on a {model} eBoss. {symptoms} What should I check?"
    
    result = chat_with_ana(query, context={'model': model, 'fault_code': fault_code})
    
    return jsonify(result)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
EOF

    print_status "ANA service code created ✓"
}

# Create requirements.txt
create_requirements() {
    print_status "Creating requirements.txt..."
    
    cat > requirements.txt <<EOF
flask==3.0.0
google-cloud-aiplatform==1.38.0
anthropic==0.40.0
gunicorn==21.2.0
googlemaps==4.10.0
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
    print_status "Building and deploying ANA to Cloud Run..."
    
    SERVICE_NAME="ana"
    
    # Build container image with Cloud Build
    gcloud builds submit --tag gcr.io/${GCP_PROJECT_ID}/${SERVICE_NAME} .
    
    # Deploy to Cloud Run
    gcloud run deploy ${SERVICE_NAME} \
        --image gcr.io/${GCP_PROJECT_ID}/${SERVICE_NAME} \
        --platform managed \
        --region ${GCP_REGION} \
        --service-account ana-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com \
        --set-env-vars "GCP_PROJECT_ID=${GCP_PROJECT_ID},GCP_REGION=${GCP_REGION}" \
        --set-secrets "ANTHROPIC_API_KEY=anthropic-api-key:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest" \
        --allow-unauthenticated \
        --memory 2Gi \
        --cpu 2 \
        --timeout 300 \
        --max-instances 10
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${GCP_REGION} --format 'value(status.url)')
    
    print_status "ANA deployed to: ${SERVICE_URL} ✓"
    echo "Service URL: ${SERVICE_URL}" > ana_url.txt
}

# Test deployment
test_deployment() {
    print_status "Testing ANA deployment..."
    
    SERVICE_URL=$(cat ana_url.txt)
    
    # Health check
    print_status "Testing health endpoint..."
    curl -s "${SERVICE_URL}/health" | jq .
    
    # Test commissioning guidance
    print_status "Testing commissioning endpoint..."
    curl -s -X POST "${SERVICE_URL}/commissioning" \
        -H "Content-Type: application/json" \
        -d '{"model": "60kW", "region": "West", "phase": "pre-commissioning"}' | jq .
    
    print_status "ANA deployment test complete ✓"
}

main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║         Deploying ANA - Field Operations Agent            ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_env
    
    echo "IMPORTANT: Ensure you have created the 'google-maps-api-key' in Secret Manager:"
    echo "  echo -n \"YOUR_MAPS_KEY\" | gcloud secrets create google-maps-api-key --data-file=-"
    echo ""
    
    create_ana_service
    create_requirements
    create_dockerfile
    deploy_cloud_run
    test_deployment
    
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                                                            ║"
    echo "║            ANA Deployment Complete! ✓                      ║"
    echo "║                                                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "ANA is now available at: $(cat ana_url.txt)"
    echo ""
    echo "Example usage:"
    echo "  # Get commissioning guidance"
    echo "  curl -X POST \$(cat ana_url.txt)/commissioning \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"model\": \"60kW\", \"region\": \"West\"}'"
    echo ""
    echo "  # Troubleshoot fault code"
    echo "  curl -X POST \$(cat ana_url.txt)/troubleshoot \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -d '{\"fault_code\": \"E001\", \"model\": \"60kW\"}'"
    echo ""
    echo "Next step: Deploy Integration Layer"
    echo "  cd ../integration-api && ./deploy_integration.sh"
    echo ""
}

main
