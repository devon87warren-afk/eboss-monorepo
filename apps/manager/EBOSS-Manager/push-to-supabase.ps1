$env:SUPABASE_ACCESS_TOKEN = "sbp_bdf8b71fbc327161d803441efa6ea2ee309444a8"

Write-Host "Pushing database schema and data to Supabase..." -ForegroundColor Yellow
supabase db push --include-all

Write-Host "Database push complete! Visit: https://supabase.com/dashboard/project/ejyiuluthrdhbtyblrpj/editor" -ForegroundColor Green
