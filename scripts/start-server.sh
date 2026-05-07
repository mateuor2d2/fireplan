#!/bin/bash
export PATH="$HOME/.bun/bin:$PATH"
export ME_CONFIG_MONGODB_URL="mongodb://127.0.0.1:27018/preveniusdbTest"
export NODE_ENV="development"
cd /home/mateu/NuxtsProjects/v9PLANESN4BUI4
nohup bun run dev > /tmp/nuxt-dev.log 2>&1 &
echo "Server started with PID $!"
