$env:SUPABASE_ACCESS_TOKEN = "sbp_bdf8b71fbc327161d803441efa6ea2ee309444a8"

Write-Host "=== Applying Supabase Database Schema and Seed Data ===" -ForegroundColor Cyan

# Read the schema SQL
Write-Host "`n[1/3] Reading schema.sql..." -ForegroundColor Yellow
$schemaContent = Get-Content -Path "supabase\schema.sql" -Raw
Write-Host "Schema file loaded" -ForegroundColor Green

# Read the seed SQL
Write-Host "`n[2/3] Reading seed.sql..." -ForegroundColor Yellow
$seedContent = Get-Content -Path "supabase\seed.sql" -Raw
Write-Host "Seed file loaded" -ForegroundColor Green

# Apply schema to remote database
Write-Host "`n[3/3] Applying schema to remote database..." -ForegroundColor Yellow
$schemaContent | supabase db execute --linked

Write-Host "`nApplying seed data to remote database..." -ForegroundColor Yellow
$seedContent | supabase db execute --linked

Write-Host "`n=== Database Setup Complete ===" -ForegroundColor Cyan
Write-Host "Visit your database: https://supabase.com/dashboard/project/ejyiuluthrdhbtyblrpj/editor" -ForegroundColor Cyan
