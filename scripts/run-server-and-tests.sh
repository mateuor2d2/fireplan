#!/bin/bash
set -e
export PATH="$HOME/.bun/bin:$PATH"
cd /home/mateu/NuxtsProjects/v9PLANESN4BUI4
export ME_CONFIG_MONGODB_URL="mongodb://127.0.0.1:27018/preveniusdbTest"
export NODE_ENV="development"

# Start dev server in background
bun run dev > /tmp/nuxt-dev.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
for i in {1..60}; do
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Run tests
bun run scripts/security-tests.mjs http://localhost:3000

# Kill server
kill $SERVER_PID 2>/dev/null || true
