#!/bin/bash
# ANA EBOSS Planner - Development Environment Launcher (Mac/Linux)
# This script starts Firebase emulators and a local HTTP server

echo "============================================"
echo "ANA EBOSS Planner - Development Mode"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}ERROR: Firebase CLI not found!${NC}"
    echo "Please install it: npm install -g firebase-tools"
    exit 1
fi

# Check if node_modules exists in functions
if [ ! -d "functions/node_modules" ]; then
    echo "Installing function dependencies..."
    cd functions && npm install && cd ..
fi

# Create data directory for emulators
mkdir -p .firebase

echo ""
echo -e "${GREEN}Starting Firebase Emulators...${NC}"
echo "  - Auth: http://127.0.0.1:9099"
echo "  - Firestore: http://127.0.0.1:8080"
echo "  - Functions: http://127.0.0.1:5001"
echo "  - Storage: http://127.0.0.1:9199"
echo "  - Hosting: http://127.0.0.1:5000"
echo "  - Emulator UI: http://127.0.0.1:4000"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down development server...${NC}"
    pkill -f "firebase emulators"
    pkill -f "http.server"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Firebase emulators in background
firebase emulators:start --import=.firebase --export-on-exit &
FIREBASE_PID=$!

# Wait for emulators to start
echo "Waiting for emulators to start..."
sleep 5

# Start HTTP server
echo ""
echo -e "${GREEN}Starting HTTP server on http://localhost:8080${NC}"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Try Python first, then Node.js
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080 &
elif command -v python &> /dev/null; then
    python -m http.server 8080 &
elif command -v npx &> /dev/null; then
    npx http-server -p 8080 -c-1 &
else
    echo -e "${RED}ERROR: No suitable HTTP server found!${NC}"
    echo "Please install Python or Node.js"
    kill $FIREBASE_PID
    exit 1
fi

# Wait for both processes
wait
