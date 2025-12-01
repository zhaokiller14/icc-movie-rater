#!/bin/bash

# ============================================
# STARTUP SCRIPT FOR AZURE APP SERVICE
# ============================================

echo "=========================================="
echo "Starting Angular application on Azure"
echo "=========================================="

# Install serve globally if not present
if ! command -v serve &> /dev/null; then
    echo "Installing serve package..."
    npm install -g serve@14.2.0
fi

# Check if index.html exists
if [ ! -f "/home/site/wwwroot/index.html" ]; then
    echo "ERROR: index.html not found in /home/site/wwwroot/"
    echo "Current directory contents:"
    ls -la /home/site/wwwroot/
    exit 1
fi

echo "✓ index.html found"
echo "Starting web server on port 8080..."

# Start the server with specific configuration for Angular
serve --single --listen tcp://0.0.0.0:8080 --no-clipboard --no-port-switching /home/site/wwwroot