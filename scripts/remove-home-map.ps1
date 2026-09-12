$file = "app\page.tsx"

$content = Get-Content $file -Raw

$content = $content -replace 'import HeritageMap from "@/components/HeritageMap";\r?\n', ''
$content = $content -replace '\s*<HeritageMap\s*/>\s*', "`r`n"

[System.IO.File]::WriteAllText(
  $file,
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Homepage map removed. Existing HeritageMap component was not changed."
