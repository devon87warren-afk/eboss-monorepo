# db-apply

Apply the Supabase database schema to the configured database.

## Instructions

You are helping apply database schema changes to Supabase for the EBOSS-Manager project.

### Steps:

1. Check if the `apply-database.ps1` script exists in the repository root
2. Verify that the `.env` file contains valid Supabase credentials
3. Run the PowerShell script: `powershell -ExecutionPolicy Bypass -File apply-database.ps1`
4. Monitor the output for any errors or warnings
5. If successful, confirm that the schema was applied
6. If there are errors:
   - Check the Supabase connection
   - Verify the schema files in `supabase/` directory
   - Report specific errors to the user

### Success Criteria:

- Script executes without errors
- Database schema is updated
- No connection or authentication issues

### Error Handling:

- If Supabase CLI is not found, inform user to install it
- If authentication fails, check `.env` file credentials
- If schema errors occur, review the SQL files in `supabase/`

## Context

This skill applies database migrations and schema changes defined in the project's `supabase/` directory to the configured Supabase instance.
