/**
 * Salesforce Contact Ownership Transfer Script
 *
 * This script transfers ownership of contacts in your territory to your user account.
 *
 * Prerequisites:
 * 1. npm install jsforce
 * 2. Set environment variables: SF_USERNAME, SF_PASSWORD, SF_TOKEN, SF_TERRITORY_ID, SF_NEW_OWNER_ID
 */

const jsforce = require('jsforce');

// Configuration
const SF_USERNAME = process.env.SF_USERNAME;
const SF_PASSWORD = process.env.SF_PASSWORD;
const SF_TOKEN = process.env.SF_TOKEN; // Security token
const SF_TERRITORY_ID = process.env.SF_TERRITORY_ID; // Your territory ID
const SF_NEW_OWNER_ID = process.env.SF_NEW_OWNER_ID; // Your Salesforce User ID
const SF_SANDBOX = process.env.SF_SANDBOX === 'true'; // Set to 'true' for sandbox

// Batch size for updates (max 200 for Salesforce API)
const BATCH_SIZE = 200;

async function transferContactOwnership() {
  const conn = new jsforce.Connection({
    loginUrl: SF_SANDBOX ? 'https://test.salesforce.com' : 'https://login.salesforce.com'
  });

  try {
    // Login to Salesforce
    console.log('🔐 Logging into Salesforce...');
    await conn.login(SF_USERNAME, SF_PASSWORD + SF_TOKEN);
    console.log('✅ Successfully logged in as:', conn.userInfo.organizationId);

    // Query contacts in your territory that you don't own
    console.log('\n📋 Querying contacts in territory...');
    const query = `
      SELECT Id, Name, Email, OwnerId, Owner.Name, Territory__c
      FROM Contact
      WHERE Territory__c = '${SF_TERRITORY_ID}'
      AND OwnerId != '${SF_NEW_OWNER_ID}'
      AND IsDeleted = false
      LIMIT 10000
    `;

    const result = await conn.query(query);
    console.log(`📊 Found ${result.totalSize} contacts to transfer`);

    if (result.totalSize === 0) {
      console.log('✨ No contacts need ownership transfer. You already own all contacts in your territory!');
      return;
    }

    // Display sample of contacts to transfer
    console.log('\n📝 Sample contacts to transfer:');
    result.records.slice(0, 5).forEach((contact, i) => {
      console.log(`  ${i + 1}. ${contact.Name} (${contact.Email}) - Current Owner: ${contact.Owner.Name}`);
    });

    // Confirm before proceeding (remove this in automated scenarios)
    console.log('\n⚠️  WARNING: This will transfer ownership of', result.totalSize, 'contacts');
    console.log('    Press Ctrl+C to cancel, or comment out this warning in production\n');

    // Prepare updates in batches
    const contactUpdates = result.records.map(contact => ({
      Id: contact.Id,
      OwnerId: SF_NEW_OWNER_ID
    }));

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process in batches
    for (let i = 0; i < contactUpdates.length; i += BATCH_SIZE) {
      const batch = contactUpdates.slice(i, i + BATCH_SIZE);
      console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(contactUpdates.length / BATCH_SIZE)} (${batch.length} records)...`);

      try {
        const updateResults = await conn.sobject('Contact').update(batch);

        // Check results
        updateResults.forEach((res, idx) => {
          if (res.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push({
              contactId: batch[idx].Id,
              error: res.errors.join(', ')
            });
          }
        });

        console.log(`  ✅ Batch complete: ${successCount} successful, ${errorCount} errors`);
      } catch (err) {
        console.error(`  ❌ Batch failed:`, err.message);
        errorCount += batch.length;
      }

      // Rate limiting: wait 100ms between batches
      if (i + BATCH_SIZE < contactUpdates.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TRANSFER SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully transferred: ${successCount} contacts`);
    console.log(`❌ Failed transfers: ${errorCount} contacts`);
    console.log(`📈 Success rate: ${((successCount / result.totalSize) * 100).toFixed(1)}%`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. Contact ${err.contactId}: ${err.error}`);
      });
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more errors`);
      }
    }

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    if (err.errorCode) {
      console.error('   Error code:', err.errorCode);
    }
    process.exit(1);
  }
}

// Run the script
transferContactOwnership()
  .then(() => {
    console.log('\n✨ Script completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n💥 Script failed:', err);
    process.exit(1);
  });
