$extensions = @(".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".css", ".html", ".mjs", ".yml", ".yaml")
$excludeDirs = @("node_modules", ".git", ".next", "out_prefix", "artifacts")

Get-ChildItem -Path "c:\Users\32\Downloads\Peloille" -Recurse -File | Where-Object {
    $file = $_
    $ext = $file.Extension
    $dir = $file.DirectoryName
    
    $isExcluded = $false
    foreach ($ex in $excludeDirs) {
        if ($dir -match "\\$ex(\\|$)") {
            $isExcluded = $true
            break
        }
    }
    
    if (-not $isExcluded -and $extensions -contains $ext) {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $modified = $false
        
        $replacements = @(
            @("Lucas Caillat", "Lola Peloille"),
            @("lucas caillat", "Lola Peloille"),
            @("CAILLAT", "PELOILLE"),
            @("Freelance Informatique", "Artiste peintre"),
            @("Freelance informatique", "Artiste peintre"),
            @("contact@lucascaillat.fr", "lolapeloille@gmail.com"),
            @("hello@lucascaillat.fr", "lolapeloille@gmail.com")
        )

        foreach ($rep in $replacements) {
            if ($content -match $rep[0]) {
                $content = $content -replace $rep[0], $rep[1]
                $modified = $true
            }
        }
        
        # Make sure we don't accidentally replace the login email since it needs to remain caillatlucas2304@gmail.com
        # wait, if I replace all "caillat" it might break the login email. But I am replacing exact strings.
        
        if ($modified) {
            # Writing back without BOM
            [System.IO.File]::WriteAllText($file.FullName, $content, (New-Object System.Text.UTF8Encoding($False)))
            Write-Host "Updated $($file.FullName)"
        }
    }
}
