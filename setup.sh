#!/bin/bash

# ECME Platform - Automatic Setup
clear
echo "==============================================="
echo "           ECME PLATFORM"
echo "==============================================="
echo ""

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  Port $1 is already in use"
        echo "   Please close the application using port $1"
        exit 1
    fi
}

echo "Checking system requirements..."

# Check ports
check_port 5173
check_port 3001
echo "✅ Ports available"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "📦 Node.js not found - installing..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if ! command -v brew &> /dev/null; then
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
        brew install node
    else
        echo "Please install Node.js from: https://nodejs.org"
        open https://nodejs.org 2>/dev/null || xdg-open https://nodejs.org 2>/dev/null
        exit 1
    fi
else
    echo "✅ Node.js ready"
fi

echo ""
echo "Installing ECME (2-3 minutes)..."
npm install --silent 2>/dev/null || npm install

echo ""
echo "🚀 Starting ECME Platform..."
sleep 1

# Start servers
node server.cjs > server.log 2>&1 &
SERVER_PID=$!
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Cleanup on exit
trap "kill $SERVER_PID $FRONTEND_PID 2>/dev/null; echo ''; echo 'ECME stopped'; exit" INT

sleep 3

# Open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5173
else
    xdg-open http://localhost:5173 2>/dev/null || echo "Open browser to: http://localhost:5173"
fi

echo ""
echo "==============================================="
echo "✅ ECME IS RUNNING AT: localhost:5173"
echo "==============================================="
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Keep running
while true; do sleep 1; done