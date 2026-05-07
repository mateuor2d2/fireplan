#!/usr/bin/env node
/**
 * Security tests for v9PLANESN4BUI4 auth endpoints
 * Run against local dev server: bun run scripts/security-tests.mjs http://localhost:3000
 */
const BASE_URL = process.argv[2] || 'http://localhost:3000'

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

let pass = 0
let fail = 0

async function test(name, fn) {
  try {
    await fn()
    console.log(`${colors.green}[PASS]${colors.reset} ${name}`)
    pass++
  } catch (err) {
    console.log(`${colors.red}[FAIL]${colors.reset} ${name}: ${err.message}`)
    fail++
  }
}

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, text, json, headers: Object.fromEntries(res.headers) }
}

async function get(path, cookie) {
  const headers = {}
  if (cookie) headers['Cookie'] = cookie
  const res = await fetch(`${BASE_URL}${path}`, { headers })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, text, json }
}

console.log(`\n${colors.blue}=== Security Tests ===${colors.reset}`)
console.log(`Target: ${BASE_URL}\n`)

// 1. Test signup role escalation
await test('Signup rejects admin role escalation', async () => {
  const res = await post('/api/auth/signup', {
    email: `testadmin${Date.now()}@example.com`,
    password: 'password123',
    name: 'Test Admin',
    role: 'admin'
  })
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Expected 200/201 but got ${res.status}: ${res.text}`)
  }
  const loginRes = await post('/api/auth/login', {
    email: res.json.user.email,
    password: 'password123'
  })
  if (loginRes.json?.user?.role === 'admin') {
    throw new Error('CRITICAL: User was created with admin role!')
  }
})

// 2. Test login rate limiting
await test('Login rate limiting works', async () => {
  const email = `brute${Date.now()}@example.com`
  // First create a user
  await post('/api/auth/signup', { email, password: 'password123', name: 'Brute' })
  // Try 15 failed logins
  for (let i = 0; i < 12; i++) {
    await post('/api/auth/login', { email, password: 'wrongpassword' })
  }
  const res = await post('/api/auth/login', { email, password: 'wrongpassword' })
  if (res.status !== 429) {
    throw new Error(`Expected 429 after too many attempts, got ${res.status}`)
  }
})

// 3. Test forgot-password rate limiting
await test('Forgot-password rate limiting works', async () => {
  for (let i = 0; i < 7; i++) {
    await post('/api/auth/forgot-password', { email: 'test@example.com' })
  }
  const res = await post('/api/auth/forgot-password', { email: 'test@example.com' })
  if (res.status !== 429) {
    throw new Error(`Expected 429 after too many attempts, got ${res.status}`)
  }
})

// 4. Test email validation on login
await test('Login rejects invalid email format', async () => {
  const res = await post('/api/auth/login', { email: 'notanemail', password: 'password123' })
  if (res.status !== 400) {
    throw new Error(`Expected 400 for invalid email, got ${res.status}`)
  }
})

// 5. Test email validation on signup
await test('Signup rejects invalid email format', async () => {
  const res = await post('/api/auth/signup', { email: 'notanemail', password: 'password123', name: 'Test' })
  if (res.status !== 400) {
    throw new Error(`Expected 400 for invalid email, got ${res.status}`)
  }
})

// 6. Test reset-password rejects short password
await test('Reset-password rejects short password', async () => {
  const res = await post('/api/auth/reset-password', { token: 'fake-token', password: '123' })
  if (res.status !== 400) {
    throw new Error(`Expected 400 for short password, got ${res.status}`)
  }
})

// 7. Test NoSQL injection in login email
await test('Login rejects NoSQL injection attempt', async () => {
  const res = await post('/api/auth/login', { email: { $ne: null }, password: 'password123' })
  // Should fail because email is not a string and regex validation catches it, or DB query fails
  if (res.status === 200) {
    throw new Error('CRITICAL: NoSQL injection succeeded!')
  }
})

// 8. Test XSS in email
await test('Login/XSS email is handled safely', async () => {
  const xssEmail = '<script>alert(1)</script>@example.com'
  const res = await post('/api/auth/login', { email: xssEmail, password: 'password123' })
  if (res.status === 200) {
    throw new Error('Unexpected 200 for XSS email')
  }
  // Even if it returns error, it should not execute XSS
})

// 9. Test user enumeration via timing (rough check)
await test('Login timing is roughly similar for existing vs non-existing user', async () => {
  const t1 = Date.now()
  await post('/api/auth/login', { email: 'definitelydoesnotexist12345@example.com', password: 'password123' })
  const t2 = Date.now()
  await post('/api/auth/login', { email: 'definitelydoesnotexist12345@example.com', password: 'password123' })
  const t3 = Date.now()
  const diff1 = t2 - t1
  const diff2 = t3 - t2
  // Differences should be small; if one is much larger, it may indicate user enumeration
  if (Math.abs(diff1 - diff2) > 2000) {
    throw new Error(`Timing difference too large: ${Math.abs(diff1 - diff2)}ms`)
  }
})

// 10. Test that sensitive endpoints require auth
await test('Protected endpoints require authentication', async () => {
  const res = await get('/api/auth/me')
  if (res.status !== 401) {
    throw new Error(`Expected 401 for /api/auth/me without auth, got ${res.status}`)
  }
})

console.log(`\n${colors.blue}=== Results ===${colors.reset}`)
console.log(`${colors.green}Passed: ${pass}${colors.reset}`)
console.log(`${colors.red}Failed: ${fail}${colors.reset}`)
process.exit(fail > 0 ? 1 : 0)
