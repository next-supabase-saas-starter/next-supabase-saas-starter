import { exec } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';
import readline from 'node:readline';
import path from 'node:path';
import os from 'node:os';

const execAsync = promisify(exec);

function question(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function checkStripeCLI() {
  console.log(
    'Step 1: Checking if Stripe CLI is installed and authenticated...'
  );
  try {
    await execAsync('stripe --version');
    console.log('Stripe CLI is installed.');

    // Check if Stripe CLI is authenticated
    try {
      await execAsync('stripe config --list');
      console.log('Stripe CLI is authenticated.');
    } catch (error) {
      console.log(
        'Stripe CLI is not authenticated or the authentication has expired.'
      );
      console.log('Please run: stripe login');
      const answer = await question(
        'Have you completed the authentication? (y/n): '
      );
      if (answer.toLowerCase() !== 'y') {
        console.log(
          'Please authenticate with Stripe CLI and run this script again.'
        );
        process.exit(1);
      }

      // Verify authentication after user confirms login
      try {
        await execAsync('stripe config --list');
        console.log('Stripe CLI authentication confirmed.');
      } catch (error) {
        console.error(
          'Failed to verify Stripe CLI authentication. Please try again.'
        );
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(
      'Stripe CLI is not installed. Please install it and try again.'
    );
    console.log('To install Stripe CLI, follow these steps:');
    console.log('1. Visit: https://docs.stripe.com/stripe-cli');
    console.log(
      '2. Download and install the Stripe CLI for your operating system'
    );
    console.log('3. After installation, run: stripe login');
    console.log(
      'After installation and authentication, please run this setup script again.'
    );
    process.exit(1);
  }
}

async function getStripeSecretKey(): Promise<string> {
  console.log('\nStep 2: Getting Stripe Secret Key');
  console.log(
    'You can find your Stripe Secret Key at: https://dashboard.stripe.com/test/apikeys'
  );
  return await question('Enter your Stripe Secret Key: ');
}

async function createStripeWebhookSecret(): Promise<string> {
  console.log('\nStep 3: Creating Stripe webhook secret...');
  try {
    const { stdout } = await execAsync('stripe listen --print-secret');
    const match = stdout.match(/whsec_[a-zA-Z0-9]+/);
    if (!match) {
      throw new Error('Failed to extract Stripe webhook secret');
    }
    console.log('Stripe webhook secret created.');
    return match[0];
  } catch (error) {
    console.error(
      'Failed to create Stripe webhook secret. Check your Stripe CLI installation and permissions.'
    );
    if (os.platform() === 'win32') {
      console.log(
        'Note: On Windows, you may need to run this script as an administrator.'
      );
    }
    throw error;
  }
}

async function checkSupabaseProject(): Promise<void> {
  console.log('\nStep 4: Checking Supabase Project Setup');
  
  const hasProject = await question('Do you already have a Supabase project? (y/n): ');
  
  if (hasProject.toLowerCase() === 'n') {
    console.log('You can create a new Supabase project at: https://database.new');
    const answer = await question('Type "continue" when you have created your project: ');
    
    if (answer.toLowerCase() !== 'continue') {
      const answer = await question('Please type "continue" when you have created your project: ');
      if(answer.toLowerCase() !== 'continue') {
        console.error('Setup cancelled. Please create a Supabase project and try again.');
        process.exit(1);
      }
    }
  } else if (hasProject.toLowerCase() === 'y') {
    console.log('Great! Continuing with existing Supabase project...');
  } else {
    console.error('Invalid input. Please enter "y" or "n".');
    process.exit(1);
  }
}

async function getSupabaseKeysApiUrl(): Promise<string> {
  console.log('\nStep 5: Getting Supabase Keys');
  console.log(
    'You can find your Supabase Keys at: supabase.com/dashboard/project/<project-id>/settings/api'
  );
  return await question('Enter your Supabase API Url: ');
}

async function getSupabaseKeysAnonKey(): Promise<string> {
  return await question('Enter your Supabase Anon Key: ');
}

async function getSupabaseKeysServiceRoleKey(): Promise<string> {
  return await question('Enter your Supabase Service Role Key: ');
}


async function writeEnvFile(envVars: Record<string, string>) {
  console.log('Step 6: Writing environment variables to .env');
  const envContent = Object.entries(envVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  await fs.writeFile(path.join(process.cwd(), '.env'), envContent);
  console.log('.env file created with the necessary variables.');
}

async function main() {
  await checkStripeCLI();
  const STRIPE_SECRET_KEY = await getStripeSecretKey();
  const STRIPE_WEBHOOK_SECRET = await createStripeWebhookSecret();
  await checkSupabaseProject();
  const NEXT_PUBLIC_SUPABASE_URL = await getSupabaseKeysApiUrl();
  const NEXT_PUBLIC_SUPABASE_ANON_KEY = await getSupabaseKeysAnonKey();
  const SUPABASE_SERVICE_ROLE_KEY = await getSupabaseKeysServiceRoleKey();

  const BASE_URL = 'http://localhost:3000';

  await writeEnvFile({
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    BASE_URL,
  });

  console.log('🎉 Setup completed successfully!');
}

main().catch(console.error);
