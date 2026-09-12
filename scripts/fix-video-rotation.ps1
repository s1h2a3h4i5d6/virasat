$file = "prisma\schema.prisma"

$content = Get-Content $file -Raw

$content = $content.Replace('sortOrder   Int                @default(0)`r`n  rotation    Int       @default(0)', "sortOrder   Int                @default(0)`r`n  rotation    Int                @default(0)")

[System.IO.File]::WriteAllText(
    $file,
    $content,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Fixed HomepageVideo schema formatting."
