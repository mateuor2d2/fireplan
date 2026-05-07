#!/bin/bash
export PATH="$HOME/.bun/bin:$PATH"
cd /home/mateu/NuxtsProjects/v9PLANESN4BUI4
bun run scripts/security-tests.mjs http://localhost:3000
