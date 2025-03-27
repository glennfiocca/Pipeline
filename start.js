#!/usr/bin/env node

// This script ensures the correct environment variables are set before starting the application
process.env.PORT = process.env.PORT || 3000;
process.env.NODE_ENV = 'production';

// Import and execute the main application
import('./dist/index.js').catch(err => {
  console.error('Failed to start application:', err);
  process.exit(1);
});