# db-push

Push local data or schema changes to the remote Supabase instance.

## Instructions

You are helping push local changes to the Supabase database.

### Steps:

1. Check if the `push-to-supabase.ps1` script exists
2. Verify Supabase connection credentials in `.env`
3. Run: `powershell -ExecutionPolicy Bypass -File push-to-supabase.ps1`
4. Monitor the output for sync status
5. Confirm successful push with a summary of changes
6. Handle any sync conflicts or errors

### Success Criteria:

- Script executes successfully
- Changes are synced to remote database
- No data loss or corruption

### Error Handling:

- Check for connection issues
- Verify write permissions on Supabase project
- Handle merge conflicts if any
- Report specific errors with context

## Context

This skill synchronizes local database changes with the remote Supabase instance, ensuring consistency between development and production environments.
