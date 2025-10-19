param(
    [string]$Output = "auth-backend.zip"
)

$ErrorActionPreference = 'Stop'

function New-TemporaryDirectory {
    $tempPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), [System.Guid]::NewGuid().ToString())
    return New-Item -ItemType Directory -Path $tempPath
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$outputZip = Join-Path $scriptDir $Output

Write-Host "Packaging project from $scriptDir"

if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
}

$tempDir = New-TemporaryDirectory
try {
    $stagingDir = Join-Path $tempDir 'auth-backend'
    New-Item -ItemType Directory -Path $stagingDir | Out-Null

    $excludeNames = @('node_modules', '.git', '.env', 'auth-backend.zip')
    $excludePatterns = @('*.zip')

    Get-ChildItem -Path $scriptDir -Force | ForEach-Object {
        $name = $_.Name
        $exclude = $false

        if ($excludeNames -contains $name) {
            $exclude = $true
        }
        else {
            foreach ($pattern in $excludePatterns) {
                if ($name -like $pattern) {
                    $exclude = $true
                    break
                }
            }
        }

        if (-not $exclude) {
            $destination = Join-Path $stagingDir $name
            if ($_.PSIsContainer) {
                Copy-Item -Path $_.FullName -Destination $destination -Recurse -Force
            }
            else {
                Copy-Item -Path $_.FullName -Destination $destination -Force
            }
        }
    }

    Compress-Archive -Path $stagingDir -DestinationPath $outputZip -Force

    Write-Host "Created deployment archive at: $outputZip"
    Write-Host "Upload this zip when configuring Render (build: npm install, start: npm start)."
    Write-Host "Remember to set PORT, SERIAL_KEY, TOKEN_TTL_SECONDS, TOKEN_SECRET in Render environment." 
}
finally {
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
}
