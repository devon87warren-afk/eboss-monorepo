# db-verify

Verify database connection and schema integrity.

## Instructions

You are helping verify the Supabase database connection and schema.

### Steps:

1. Check if `verify-database.ps1` exists in the repository
2. Run: `powershell -ExecutionPolicy Bypass -File verify-database.ps1`
3. Parse the output to check:
   - Connection status
   - Schema integrity
   - Table structure matches expectations
   - Relationships are correct
4. Report findings in a clear, structured format
5. If issues are found:
   - List specific problems
   - Suggest remediation steps
   - Indicate severity of each issue

### Success Criteria:

- Database connection is active
- All expected tables exist
- Schema matches type definitions
- No structural inconsistencies

### Verification Checklist:

- [ ] Supabase connection successful
- [ ] All tables from schema exist
- [ ] Foreign key relationships intact
- [ ] Indexes are present
- [ ] No orphaned or missing tables

### Error Handling:

- Connection failures: Check credentials and network
- Schema mismatches: Compare with `types.ts`
- Missing tables: Run schema application first
- Permission issues: Verify Supabase project access

## Context

This skill validates that the database is properly configured and matches the expected schema defined in the application code.
