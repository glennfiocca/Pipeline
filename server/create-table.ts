import { createReferralCodesTable } from './db';

async function main() {
  try {
    console.log('Starting to create the referral_codes table...');
    const success = await createReferralCodesTable();
    
    if (success) {
      console.log('Table creation completed successfully!');
    } else {
      console.error('Failed to create the referral_codes table.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error in create-table script:', error);
    process.exit(1);
  }
}

main(); 