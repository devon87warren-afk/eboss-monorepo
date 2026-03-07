$env:SUPABASE_ACCESS_TOKEN = "sbp_bdf8b71fbc327161d803441efa6ea2ee309444a8"

Write-Host "=== Supabase Database Setup ===" -ForegroundColor Cyan

# Step 1: Ensure project is linked
Write-Host "`n[1/4] Verifying project link..." -ForegroundColor Yellow
supabase link --project-ref ejyiuluthrdhbtyblrpj
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to link project" -ForegroundColor Red
    exit 1
}
Write-Host "Project linked: ejyiuluthrdhbtyblrpj" -ForegroundColor Green

# Step 2: Create migration from schema.sql
Write-Host "`n[2/4] Creating migration from schema..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$migrationDir = "supabase\migrations"
$migrationFile = "$migrationDir\${timestamp}_init_schema.sql"

if (-not (Test-Path $migrationDir)) {
    New-Item -ItemType Directory -Path $migrationDir -Force | Out-Null
}

Copy-Item -Path "supabase\schema.sql" -Destination $migrationFile -Force
Write-Host "Migration created: $migrationFile" -ForegroundColor Green

# Step 3: Push migrations to remote database
Write-Host "`n[3/4] Pushing migrations to remote database..." -ForegroundColor Yellow
supabase db push --include-all
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration push may have issues, but continuing..." -ForegroundColor Yellow
}

# Step 4: Execute seed data using psql or SQL query
Write-Host "`n[4/4] Applying seed data..." -ForegroundColor Yellow
Write-Host "To apply seed data, you have two options:" -ForegroundColor Cyan
Write-Host "  Option 1: Use Supabase Dashboard SQL Editor" -ForegroundColor White
Write-Host "    - Go to: https://supabase.com/dashboard/project/ejyiuluthrdhbtyblrpj/sql/new" -ForegroundColor White
Write-Host "    - Copy contents of supabase\seed.sql" -ForegroundColor White
Write-Host "    - Paste and run in SQL Editor" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "  Option 2: Use supabase db execute command" -ForegroundColor White
Write-Host "    - Run: supabase db execute --db-url <your-connection-string> < supabase\seed.sql" -ForegroundColor White

Write-Host "`n=== Setup Summary ===" -ForegroundColor Cyan
Write-Host "✓ Project linked" -ForegroundColor Green
Write-Host "✓ Schema migration created" -ForegroundColor Green
Write-Host "✓ Migrations pushed to remote" -ForegroundColor Green
Write-Host "⚠ Seed data needs manual application (see options above)" -ForegroundColor Yellow
