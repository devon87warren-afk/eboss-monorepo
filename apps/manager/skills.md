# EBOSS-Manager Skills

This document defines custom skills (slash commands) for the EBOSS-Manager project.

## Database Management Skills

### `/db-apply` - Apply Database Schema
Applies the Supabase database schema from the `supabase/` directory to the configured database.

**Usage:** `/db-apply`

**What it does:**
- Runs the `apply-database.ps1` PowerShell script
- Applies migrations and schema changes to Supabase
- Verifies the application was successful

---

### `/db-push` - Push Data to Supabase
Pushes local data or schema changes to the remote Supabase instance.

**Usage:** `/db-push`

**What it does:**
- Executes `push-to-supabase.ps1`
- Syncs local changes with remote database
- Shows confirmation of pushed changes

---

### `/db-verify` - Verify Database Connection
Verifies that the database connection and schema are working correctly.

**Usage:** `/db-verify`

**What it does:**
- Runs `verify-database.ps1`
- Checks Supabase connection
- Validates schema integrity
- Reports any issues found

---

### `/db-setup` - Setup Remote Database
Initial setup of the remote Supabase database with proper configuration.

**Usage:** `/db-setup`

**What it does:**
- Executes `setup-remote-db.ps1`
- Configures remote database connection
- Sets up initial schema
- Creates necessary tables and relationships

---

## UI Component Skills

### `/component` - Generate New Component
Creates a new React component with proper TypeScript types and structure.

**Usage:** `/component <ComponentName>`

**Example:** `/component UserProfileCard`

**What it does:**
- Creates component file in `components/` directory
- Sets up TypeScript interface for props
- Adds proper imports and exports
- Follows project's component structure patterns

---

### `/radix-component` - Create Radix UI Component
Generates a new component using Radix UI primitives with Tailwind styling.

**Usage:** `/radix-component <ComponentName> <RadixPrimitive>`

**Example:** `/radix-component CustomDialog Dialog`

**What it does:**
- Creates component using specified Radix UI primitive
- Adds Tailwind CSS styling classes
- Sets up proper TypeScript types
- Includes accessibility attributes

---

### `/page` - Create New Page
Generates a new page component with routing setup.

**Usage:** `/page <PageName>`

**Example:** `/page UserSettings`

**What it does:**
- Creates page component in appropriate directory
- Adds route configuration
- Sets up layout structure
- Includes navigation integration

---

## Testing & Validation Skills

### `/typecheck` - Run TypeScript Type Check
Runs TypeScript compiler to check for type errors without emitting files.

**Usage:** `/typecheck`

**What it does:**
- Executes `tsc --noEmit`
- Reports all type errors in the codebase
- Shows file locations and error descriptions
- Provides count of total errors found

---

### `/validate-schema` - Validate Database Schema
Validates that the database schema matches the TypeScript types.

**Usage:** `/validate-schema`

**What it does:**
- Compares `types.ts` with Supabase schema
- Checks for mismatches between types and database
- Reports missing or incorrect type definitions
- Suggests fixes for schema inconsistencies

---

### `/test-api` - Test API Endpoints
Tests Supabase API endpoints to ensure they're working correctly.

**Usage:** `/test-api`

**What it does:**
- Tests connection to Supabase
- Verifies API endpoints are accessible
- Checks authentication flow
- Reports any failed endpoints

---

## Deployment Skills

### `/build` - Build Production Bundle
Creates an optimized production build of the application.

**Usage:** `/build`

**What it does:**
- Runs `npm run build`
- Compiles TypeScript
- Bundles with Vite
- Optimizes assets
- Reports build size and warnings

---

### `/prebuild-check` - Pre-Build Validation
Runs all checks before building for production.

**Usage:** `/prebuild-check`

**What it does:**
- Runs TypeScript type checking
- Validates database schema
- Checks for console.log statements
- Verifies environment variables are set
- Reports any issues that should be fixed

---

### `/deploy-preview` - Preview Deployment
Builds and previews the application as it would appear in production.

**Usage:** `/deploy-preview`

**What it does:**
- Runs production build
- Starts preview server
- Opens preview in browser
- Shows deployment URLs

---

## Utility Skills

### `/analyze-bundle` - Analyze Bundle Size
Analyzes the production bundle to identify large dependencies.

**Usage:** `/analyze-bundle`

**What it does:**
- Builds with bundle analysis enabled
- Shows size breakdown by module
- Identifies largest dependencies
- Suggests optimization opportunities

---

### `/clean` - Clean Build Artifacts
Removes build artifacts and cached files.

**Usage:** `/clean`

**What it does:**
- Removes `dist/` directory
- Clears `node_modules/.vite` cache
- Removes TypeScript build info
- Reports cleaned directories

---

### `/update-deps` - Update Dependencies
Checks for and updates project dependencies.

**Usage:** `/update-deps`

**What it does:**
- Checks for outdated packages
- Shows available updates
- Asks for confirmation before updating
- Updates package.json and package-lock.json
- Runs npm install

---

## Usage Notes

- All skills are invoked with the `/` prefix followed by the skill name
- Skills that accept parameters show them in angle brackets `<parameter>`
- Skills run in the context of the repository root directory
- PowerShell scripts require Windows environment
- Database skills require Supabase CLI and valid `.env` configuration
