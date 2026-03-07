$env:SUPABASE_ACCESS_TOKEN = "sbp_bdf8b71fbc327161d803441efa6ea2ee309444a8"

Write-Host "Linking Supabase project..." -ForegroundColor Green
supabase link --project-ref ejyiuluthrdhbtyblrpj

if ($LASTEXITCODE -eq 0) {
    Write-Host "Project linked successfully!" -ForegroundColor Green

    Write-Host "Pushing database schema..." -ForegroundColor Green
    supabase db push

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Schema pushed successfully!" -ForegroundColor Green
        Write-Host "Applying seed data..." -ForegroundColor Green

        # Execute seed.sql
        supabase db reset

        Write-Host "Database setup complete!" -ForegroundColor Green
    }
}
