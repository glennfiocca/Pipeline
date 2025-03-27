#!/usr/bin/env node

// This script is designed to help with deployment to Replit
// It ensures the correct environment variables are set

const fs = require('fs');
const path = require('path');

// Check if server/index.ts uses the PORT environment variable
const serverPath = path.join(__dirname, 'server', 'index.ts');
const serverCode = fs.readFileSync(serverPath, 'utf8');

if (!serverCode.includes('process.env.PORT')) {
  console.error('⚠️ WARNING: server/index.ts does not use process.env.PORT');
  console.error('Please update your server code to use: const PORT = process.env.PORT || 3000;');
  process.exit(1);
}

// Create a .port-config.json file if it doesn't exist
const portConfigPath = path.join(__dirname, '.port-config.json');
const portConfig = { port: 3000 };

fs.writeFileSync(portConfigPath, JSON.stringify(portConfig, null, 2));
console.log('✅ Created .port-config.json');

// Create a .env file if it doesn't exist
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, 'PORT=3000\n');
  console.log('✅ Created .env file');
}

console.log('✅ Deployment preparation complete!');
console.log('Your application is now configured to use PORT=3000');
console.log('When deploying, make sure to set the correct PORT in your environment variables.');