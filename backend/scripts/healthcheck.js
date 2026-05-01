#!/usr/bin/env node
/**
 * healthcheck.js — Production smoke test
 * 
 * Runs after deployment to verify the backend is alive and all critical
 * endpoints return expected responses.
 * 
 * Usage: BACKEND_URL=https://api.jatham.app node scripts/healthcheck.js
 * Exit code 0 = all checks passed, 1 = at least one check failed.
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const TIMEOUT_MS = 10000;

let passed = 0;
let failed = 0;

async function check(name, url, options = {}) {
  const { expectedStatus = 200, expectedBody } = options;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);

    const body = await res.json().catch(() => ({}));
    const statusOk = res.status === expectedStatus;
    const bodyOk = !expectedBody || JSON.stringify(body).includes(expectedBody);

    if (statusOk && bodyOk) {
      console.log(`  ✅ ${name} — HTTP ${res.status}`);
      passed++;
    } else {
      console.log(`  ❌ ${name} — Expected ${expectedStatus}, got ${res.status}`);
      if (expectedBody && !bodyOk) console.log(`     Body missing: "${expectedBody}"`);
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ ${name} — ${err.name === 'AbortError' ? 'Timeout' : err.message}`);
    failed++;
  }
}

async function run() {
  console.log(`\n🔍 Jatham Backend Health Check`);
  console.log(`   Target: ${BACKEND_URL}\n`);

  // ── Core health ────────────────────────────────────────────────────────────
  await check('Health endpoint', `${BACKEND_URL}/health`, { expectedBody: 'ok' });

  // ── Security checks ────────────────────────────────────────────────────────
  await check('robots.txt', `${BACKEND_URL}/robots.txt`, { expectedBody: 'Disallow' });
  await check('security.txt', `${BACKEND_URL}/.well-known/security.txt`, { expectedBody: 'Contact' });

  // ── API protection ─────────────────────────────────────────────────────────
  await check('Auth routes require body', `${BACKEND_URL}/api/auth/verify-otp`, {
    expectedStatus: 405 // GET not allowed on POST-only route
  });
  await check('Match routes require auth', `${BACKEND_URL}/api/matches`, {
    expectedStatus: 401
  });
  await check('Profile routes require auth', `${BACKEND_URL}/api/profiles/me`, {
    expectedStatus: 401
  });

  // ── 404 handling ──────────────────────────────────────────────────────────
  await check('404 returns JSON', `${BACKEND_URL}/api/does-not-exist`, {
    expectedStatus: 404,
    expectedBody: 'Not found'
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(40)}`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log(`\n  ❌ Health check FAILED — deployment may be broken\n`);
    process.exit(1);
  }
  console.log(`\n  ✅ All checks passed — deployment is healthy\n`);
  process.exit(0);
}

run();
