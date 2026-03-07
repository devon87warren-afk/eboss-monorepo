# db-setup

Initial setup of the remote Supabase database with proper configuration.

## Instructions

You are helping set up the remote Supabase database for the first time.

### Steps:

1. Verify `.env` file exists with required variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Check if `setup-remote-db.ps1` exists
3. Run: `powershell -ExecutionPolicy Bypass -File setup-remote-db.ps1`
4. Monitor the setup process:
   - Database initialization
   - Schema creation
   - Initial table setup
   - Relationship establishment
5. Verify setup completed successfully
6. Test connection with a simple query

### Success Criteria:

- Remote database is accessible
- All tables are created
- Relationships are established
- Authentication is configured
- Initial setup is complete

### Setup Checklist:

- [ ] Supabase project created/accessible
- [ ] Environment variables configured
- [ ] Schema applied successfully
- [ ] Tables created with correct structure
- [ ] Foreign keys established
- [ ] Row Level Security (RLS) policies set
- [ ] Connection test successful

### Error Handling:

- Missing credentials: Guide user to create `.env` file
- Supabase project not found: Verify project URL
- Permission issues: Check API key permissions
- Network errors: Verify internet connection
- Schema errors: Review SQL syntax

## Context

This is a one-time setup skill that initializes the remote Supabase database for the EBOSS-Manager project. It should be run when setting up a new environment or Supabase project.
