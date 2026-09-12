$file = "prisma\schema.prisma"
$content = Get-Content $file -Raw

if ($content -notmatch 'rotation\s+Int\s+@default\(0\)') {
    $content = $content -replace '(model HomepageVideo \{[\s\S]*?sortOrder\s+Int\s+@default\(0\))', '$1`r`n  rotation    Int       @default(0)'
    [System.IO.File]::WriteAllText(
        $file,
        $content,
        [System.Text.UTF8Encoding]::new($false)
    )
    Write-Host "Added HomepageVideo rotation field."
} else {
    Write-Host "HomepageVideo rotation field already exists. Nothing changed."
}
