"""
Salesforce Contact Ownership Transfer Script (Python)

This script transfers ownership of contacts in your territory to your user account.

Prerequisites:
1. pip install simple-salesforce python-dotenv
2. Create a .env file with your credentials (see .env.example)
"""

import os
from dotenv import load_dotenv
from simple_salesforce import Salesforce
import sys

# Load environment variables
load_load_dotenv()

# Configuration
SF_USERNAME = os.getenv('SF_USERNAME')
SF_PASSWORD = os.getenv('SF_PASSWORD')
SF_TOKEN = os.getenv('SF_TOKEN')  # Security token
SF_TERRITORY_ID = os.getenv('SF_TERRITORY_ID')  # Your territory ID
SF_NEW_OWNER_ID = os.getenv('SF_NEW_OWNER_ID')  # Your Salesforce User ID
SF_SANDBOX = os.getenv('SF_SANDBOX', 'false').lower() == 'true'

# Batch size for updates
BATCH_SIZE = 200


def transfer_contact_ownership():
    """Transfer contact ownership in bulk"""

    try:
        # Login to Salesforce
        print('🔐 Logging into Salesforce...')
        domain = 'test' if SF_SANDBOX else 'login'
        sf = Salesforce(
            username=SF_USERNAME,
            password=SF_PASSWORD,
            security_token=SF_TOKEN,
            domain=domain
        )
        print(f'✅ Successfully logged in to {domain}.salesforce.com')

        # Query contacts in your territory that you don't own
        print('\n📋 Querying contacts in territory...')
        query = f"""
            SELECT Id, Name, Email, OwnerId, Owner.Name, Territory__c
            FROM Contact
            WHERE Territory__c = '{SF_TERRITORY_ID}'
            AND OwnerId != '{SF_NEW_OWNER_ID}'
            AND IsDeleted = false
            LIMIT 10000
        """

        result = sf.query(query)
        total_contacts = result['totalSize']
        contacts = result['records']

        print(f'📊 Found {total_contacts} contacts to transfer')

        if total_contacts == 0:
            print('✨ No contacts need ownership transfer. You already own all contacts in your territory!')
            return

        # Display sample of contacts to transfer
        print('\n📝 Sample contacts to transfer:')
        for i, contact in enumerate(contacts[:5], 1):
            print(f"  {i}. {contact['Name']} ({contact.get('Email', 'No email')}) - Current Owner: {contact['Owner']['Name']}")

        # Warning
        print(f'\n⚠️  WARNING: This will transfer ownership of {total_contacts} contacts')
        print('    Press Ctrl+C to cancel, or comment out this warning in production\n')

        # Prepare updates
        success_count = 0
        error_count = 0
        errors = []

        # Process in batches
        for i in range(0, len(contacts), BATCH_SIZE):
            batch = contacts[i:i + BATCH_SIZE]
            batch_num = (i // BATCH_SIZE) + 1
            total_batches = (len(contacts) + BATCH_SIZE - 1) // BATCH_SIZE

            print(f'\n🔄 Processing batch {batch_num}/{total_batches} ({len(batch)} records)...')

            try:
                # Update contacts in batch
                for contact in batch:
                    try:
                        sf.Contact.update(contact['Id'], {'OwnerId': SF_NEW_OWNER_ID})
                        success_count += 1
                    except Exception as e:
                        error_count += 1
                        errors.append({
                            'contactId': contact['Id'],
                            'name': contact['Name'],
                            'error': str(e)
                        })

                print(f'  ✅ Batch complete: {success_count} successful, {error_count} errors so far')

            except Exception as e:
                print(f'  ❌ Batch failed: {str(e)}')
                error_count += len(batch)

        # Summary
        print('\n' + '=' * 60)
        print('📊 TRANSFER SUMMARY')
        print('=' * 60)
        print(f'✅ Successfully transferred: {success_count} contacts')
        print(f'❌ Failed transfers: {error_count} contacts')
        print(f'📈 Success rate: {(success_count / total_contacts * 100):.1f}%')

        if errors:
            print(f'\n❌ Errors encountered ({len(errors)} total):')
            for i, err in enumerate(errors[:10], 1):
                print(f"  {i}. {err['name']} ({err['contactId']}): {err['error']}")
            if len(errors) > 10:
                print(f'  ... and {len(errors) - 10} more errors')

    except Exception as e:
        print(f'❌ Fatal error: {str(e)}')
        sys.exit(1)


if __name__ == '__main__':
    transfer_contact_ownership()
    print('\n✨ Script completed successfully!')
