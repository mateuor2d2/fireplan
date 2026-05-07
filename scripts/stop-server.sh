#!/bin/bash
pkill -f "bun run dev" 2>/dev/null || true
echo "Server stopped"
