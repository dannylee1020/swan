param(
  [string]$Version = $env:SWAN_VERSION,
  [string]$InstallDir = $(Join-Path $env:LOCALAPPDATA "Swan\extension\chrome-mv3"),
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

$Repo = "dannylee1020/swan"
$AssetName = "swan-chromium.zip"
$ReleasesApiUrl = "https://api.github.com/repos/$Repo/releases"

function Resolve-LatestDownloadUrl {
  $Releases = Invoke-RestMethod -Uri $ReleasesApiUrl -Headers @{ Accept = "application/vnd.github+json" }
  $Asset = $Releases |
    ForEach-Object { $_.assets } |
    Where-Object { $_.name -eq $AssetName } |
    Select-Object -First 1

  if (!$Asset) {
    throw "Could not find $AssetName on any published GitHub release. Set SWAN_VERSION to a release tag or SWAN_DOWNLOAD_URL to a direct zip URL."
  }

  return $Asset.browser_download_url
}

if ($env:SWAN_DOWNLOAD_URL) {
  $DownloadUrl = $env:SWAN_DOWNLOAD_URL
} elseif ($Version) {
  $DownloadUrl = "https://github.com/$Repo/releases/download/$Version/$AssetName"
} else {
  $DownloadUrl = Resolve-LatestDownloadUrl
}

$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("swan-" + [System.Guid]::NewGuid())
$ZipPath = Join-Path $TempDir $AssetName
$ExtractDir = Join-Path $TempDir "extract"
$NextDir = "$InstallDir.next"
$BackupDir = "$InstallDir.previous"

try {
  New-Item -ItemType Directory -Path $TempDir, $ExtractDir -Force | Out-Null

  Write-Host "Downloading Swan Chromium extension..."
  Write-Host "Source: $DownloadUrl"
  if (Test-Path $DownloadUrl) {
    Copy-Item -Path $DownloadUrl -Destination $ZipPath -Force
  } else {
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipPath
  }

  Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force

  $ManifestPath = Join-Path $ExtractDir "manifest.json"
  if (!(Test-Path $ManifestPath)) {
    throw "Downloaded Swan zip is invalid: manifest.json was not found at the zip root."
  }

  $ParentDir = Split-Path -Parent $InstallDir
  New-Item -ItemType Directory -Path $ParentDir -Force | Out-Null

  if (Test-Path $NextDir) {
    Remove-Item -Path $NextDir -Recurse -Force
  }
  if (Test-Path $BackupDir) {
    Remove-Item -Path $BackupDir -Recurse -Force
  }

  New-Item -ItemType Directory -Path $NextDir -Force | Out-Null
  Copy-Item -Path (Join-Path $ExtractDir "*") -Destination $NextDir -Recurse -Force

  if (Test-Path $InstallDir) {
    Move-Item -Path $InstallDir -Destination $BackupDir
  }

  Move-Item -Path $NextDir -Destination $InstallDir

  if (Test-Path $BackupDir) {
    Remove-Item -Path $BackupDir -Recurse -Force
  }

  Write-Host ""
  Write-Host "Swan is installed at:"
  Write-Host "  $InstallDir"
  Write-Host ""
  Write-Host "Load Swan in Chromium:"
  Write-Host "  1. Open chrome://extensions"
  Write-Host "  2. Enable Developer Mode"
  Write-Host "  3. Click Load unpacked"
  Write-Host "  4. Select: $InstallDir"
  Write-Host ""
  Write-Host "For updates, rerun this installer, then click reload for Swan in chrome://extensions."
  Write-Host "Do not remove Swan from the browser unless you intend to clear extension-local settings."
  Write-Host ""

  if (!$NoOpen) {
    Start-Process "chrome://extensions"
  }
} finally {
  if (Test-Path $TempDir) {
    Remove-Item -Path $TempDir -Recurse -Force
  }
}
