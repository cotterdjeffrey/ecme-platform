#!/bin/bash

# ECME Platform - Clean Removal
echo "==============================================="
echo "         ECME PLATFORM CLEANUP"
echo "==============================================="
echo ""
echo "This will remove:"
echo "  • node_modules/ folder"
echo "  • Log files"
echo "  • Temporary files"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleaning up..."
    rm -rf node_modules/
    rm -f server.log frontend.log
    rm -f package-lock.json
    echo "✅ Cleanup complete"
    echo ""
    echo "To fully remove ECME, delete this folder"
else
    echo "Cleanup cancelled"
fi