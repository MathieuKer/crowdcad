import path from 'node:path';
import dotenv from 'dotenv';

// Load test env vars so E2E_TEST_EMAIL and E2E_TEST_PASSWORD are available
dotenv.config({ path: path.join(__dirname, '../../.env.test.local') });

const EMULATOR_PROJECT_ID = 'demo-crowdcad';
const AUTH_EMULATOR_URL = 'http://localhost:9099';

/**
 * Global setup: runs once before all tests, after webServer is ready.
 *
 * Clears all emulator auth accounts and creates a fresh test user so that
 * auth.setup.ts can log in with known credentials.
 */
async function globalSetup() {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set in .env.test.local'
    );
  }

  // Clear all existing users in the auth emulator to start fresh
  const clearResponse = await fetch(
    `${AUTH_EMULATOR_URL}/emulator/v1/projects/${EMULATOR_PROJECT_ID}/accounts`,
    { method: 'DELETE' }
  );

  if (!clearResponse.ok) {
    console.warn(
      `[global-setup] Warning: Failed to clear emulator accounts (${clearResponse.status}). Proceeding anyway.`
    );
  }

  // Create the test user via the Auth Emulator REST API
  const signUpResponse = await fetch(
    `${AUTH_EMULATOR_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );

  if (!signUpResponse.ok) {
    const body = await signUpResponse.text();
    throw new Error(
      `[global-setup] Failed to create test user in emulator: ${signUpResponse.status} — ${body}`
    );
  }

  console.log(`[global-setup] Test user created: ${email}`);
}

export default globalSetup;
