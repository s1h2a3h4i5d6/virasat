$file = "app\page.tsx"
$content = Get-Content $file -Raw

# 1. Add the new component import
$content = $content -replace `
'import DiscoverHeritage from "@/components/heritage/DiscoverHeritage";', `
'import DiscoverHeritage from "@/components/heritage/DiscoverHeritage";' + "`r`n" + 'import HomepageVideoShowcase from "@/components/home/HomepageVideoShowcase";'

# 2. Add homepage video query to the existing Promise.all
$content = $content -replace `
'const \[slides, categories, heritage, preservationHeritage\] =', `
'const [slides, categories, heritage, preservationHeritage, homepageVideos] ='

$content = $content -replace `
'\r?\n\s*\]\);', `
'
      prisma.homepageVideo.findMany({
        where: {
          status: "APPROVED",
          published: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "desc",
          },
        ],
      }),
    ]);', 1

# 3. Add the video showcase before Featured Archive
$content = $content -replace `
'<section className="bg-\[#0b0b0b\] px-6 pb-24 text-white md:px-10">', `
'<HomepageVideoShowcase videos={homepageVideos} />

      <section className="bg-[#0b0b0b] px-6 pb-24 text-white md:px-10">', 1

[System.IO.File]::WriteAllText(
    $file,
    $content,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Homepage connected to approved and published videos."
