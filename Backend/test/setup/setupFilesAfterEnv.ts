import dotenv from 'dotenv';
import path from 'path';

// Determine the path to the .env.test file, assuming this setup file
// is in test/setup/ and .env.test is in the project root.
const envTestPath = path.resolve(__dirname, '../../test.env');

// Load environment variables from .env.test into process.env
const result = dotenv.config({ path: envTestPath });

if (result.error) {
    console.warn(`⚠️ Warning: Could not load .env.test file from ${envTestPath}. Tests might use unexpected environment configurations. Error: ${result.error.message}`);
} else if (result.parsed) {
    console.log(`✅ Environment variables loaded for testing from: ${envTestPath}`);
} else {
    console.log(`ℹ️ No .env.test file found at ${envTestPath}, or it is empty. Using system/default environment variables.`);
}


// You can add other global test setup logic here if needed,
// for example, extending Jest matchers:
// import '@testing-library/jest-dom'; // If using jest-dom for frontend tests (not applicable here)