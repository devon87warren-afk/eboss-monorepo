$env:SUPABASE_ACCESS_TOKEN = "sbp_bdf8b71fbc327161d803441efa6ea2ee309444a8"

Write-Host "Verifying Supabase database setup..." -ForegroundColor Cyan

Write-Host "`nDumping schema to verify tables..." -ForegroundColor Yellow
supabase db dump --schema public

Write-Host "`nDatabase verification complete!" -ForegroundColor Green
Write-Host "View your data at: https://supabase.com/dashboard/project/ejyiuluthrdhbtyblrpj/editor" -ForegroundColor Cyan
