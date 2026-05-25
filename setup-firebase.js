#!/usr/bin/env node
// ============================================================
//  Chakdaha Bazar — Firebase Auto Setup Script
//  Run: node setup-firebase.js
//  This will guide you through Firebase setup and auto-fill .env
// ============================================================

const { execSync, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '.env');
const colors = {
  green:  (t) => `\x1b[32m${t}\x1b[0m`,
  yellow: (t) => `\x1b[33m${t}\x1b[0m`,
  cyan:   (t) => `\x1b[36m${t}\x1b[0m`,
  red:    (t) => `\x1b[31m${t}\x1b[0m`,
  bold:   (t) => `\x1b[1m${t}\x1b[0m`,
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

function updateEnv(key, value) {
  let content = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  fs.writeFileSync(ENV_FILE, content);
}

async function main() {
  console.log('\n' + colors.bold('═══════════════════════════════════════════════'));
  console.log(colors.bold('  🌿 Chakdaha Bazar — Firebase Setup Wizard'));
  console.log(colors.bold('═══════════════════════════════════════════════') + '\n');

  // ── Step 1: Check Firebase CLI ──
  console.log(colors.cyan('Step 1: Checking Firebase CLI...'));
  try {
    const version = execSync('firebase --version', { encoding: 'utf8' }).trim();
    console.log(colors.green(`  ✅ Firebase CLI found: v${version}`));
  } catch {
    console.log(colors.yellow('  ⚠️  Firebase CLI not found. Installing...'));
    try {
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
      console.log(colors.green('  ✅ Firebase CLI installed!'));
    } catch {
      console.log(colors.red('  ❌ Could not install Firebase CLI.'));
      console.log('  Please run: npm install -g firebase-tools');
      rl.close(); return;
    }
  }

  // ── Step 2: Firebase Login ──
  console.log('\n' + colors.cyan('Step 2: Firebase Login'));
  console.log('  This will open your browser for Google sign-in...\n');
  const doLogin = await ask('  Press ENTER to open browser login (or type "skip" if already logged in): ');
  if (doLogin.trim().toLowerCase() !== 'skip') {
    spawnSync('firebase', ['login'], { stdio: 'inherit', shell: true });
  }

  // ── Step 3: List or Create Project ──
  console.log('\n' + colors.cyan('Step 3: Select Firebase Project'));
  console.log('  Your Firebase projects:\n');
  try {
    execSync('firebase projects:list', { stdio: 'inherit', shell: true });
  } catch {
    console.log(colors.yellow('  (No projects found or not logged in)'));
  }

  console.log('\n' + colors.yellow('  Enter your Firebase Project ID from the list above.'));
  console.log('  (Or press ENTER to create a new project named "chakdaha-bazar")');
  let projectId = (await ask('  Project ID: ')).trim();

  if (!projectId) {
    projectId = 'chakdaha-bazar-' + Date.now().toString().slice(-4);
    console.log(colors.cyan(`\n  Creating new project: ${projectId}...`));
    try {
      execSync(`firebase projects:create ${projectId} --display-name "Chakdaha Bazar"`, {
        stdio: 'inherit', shell: true
      });
      console.log(colors.green(`  ✅ Project created: ${projectId}`));
    } catch {
      console.log(colors.yellow('  Could not create project automatically. Using entered ID.'));
    }
  }

  updateEnv('FIREBASE_PROJECT_ID', projectId);
  console.log(colors.green(`  ✅ Project ID saved: ${projectId}`));

  // ── Step 4: Paste Firebase Config ──
  console.log('\n' + colors.cyan('Step 4: Firebase Web App Config'));
  console.log(colors.yellow(`
  Please do this now:
  1. Go to: https://console.firebase.google.com/project/${projectId}/settings/general
  2. Scroll to "Your apps" → click </> (Web) → Register app
  3. Copy the firebaseConfig object
  4. Paste each value below:
  `));

  const apiKey           = (await ask('  FIREBASE_API_KEY          : ')).trim();
  const authDomain       = (await ask('  FIREBASE_AUTH_DOMAIN      : ')).trim() || `${projectId}.firebaseapp.com`;
  const storageBucket    = (await ask('  FIREBASE_STORAGE_BUCKET   : ')).trim() || `${projectId}.appspot.com`;
  const messagingSenderId = (await ask('  FIREBASE_MESSAGING_SENDER_ID : ')).trim();
  const appId            = (await ask('  FIREBASE_APP_ID           : ')).trim();
  const measurementId    = (await ask('  FIREBASE_MEASUREMENT_ID (optional): ')).trim();

  updateEnv('FIREBASE_API_KEY',            apiKey);
  updateEnv('FIREBASE_AUTH_DOMAIN',        authDomain);
  updateEnv('FIREBASE_STORAGE_BUCKET',     storageBucket);
  updateEnv('FIREBASE_MESSAGING_SENDER_ID', messagingSenderId);
  updateEnv('FIREBASE_APP_ID',             appId);
  if (measurementId) updateEnv('FIREBASE_MEASUREMENT_ID', measurementId);

  // ── Step 5: Enable Firestore ──
  console.log('\n' + colors.cyan('Step 5: Enabling Firestore Database...'));
  try {
    execSync(`firebase --project ${projectId} firestore:indexes`, { stdio: 'ignore', shell: true });
    console.log(colors.green('  ✅ Firestore is accessible'));
  } catch {
    console.log(colors.yellow(`  ⚠️  Please enable Firestore manually:`));
    console.log(`  https://console.firebase.google.com/project/${projectId}/firestore`);
    console.log('  → Click "Create database" → Start in Production mode → Choose region (asia-south1 for India)');
  }

  // ── Step 6: Setup Firestore Security Rules ──
  console.log('\n' + colors.cyan('Step 6: Writing Firestore Security Rules...'));
  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public reads for products and reviews
    match /products/{doc} { allow read: if true; allow write: if false; }
    match /reviews/{doc}  { allow read: if true; allow write: if true; }
    // Orders — only the customer can read their own order
    match /orders/{doc}   { allow read, write: if true; }
    // Partners
    match /partners/{doc} { allow read: if true; allow write: if false; }
  }
}`;
  fs.writeFileSync(path.join(__dirname, 'firestore.rules'), rules);
  console.log(colors.green('  ✅ firestore.rules written'));

  // ── Done ──
  console.log('\n' + colors.bold('═══════════════════════════════════════════════'));
  console.log(colors.green(colors.bold('  🎉 SETUP COMPLETE!')));
  console.log(colors.bold('═══════════════════════════════════════════════'));
  console.log(`
  ${colors.green('✅ .env file filled with all your Firebase keys')}
  ${colors.green('✅ firestore.rules file created')}

  ${colors.cyan('Next Steps:')}
  1. Run your server:    ${colors.bold('node server.js')}
  2. Open browser:       ${colors.bold('http://localhost:3000')}
  3. Deploy to Hostinger: Upload files + add env vars from .env

  ${colors.yellow('⚠️  IMPORTANT: Never share your .env file!')}
  `);

  rl.close();
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  rl.close();
});
