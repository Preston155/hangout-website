$linkPath = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup\Hangout Auto Publish.lnk"
$vbsPath = Join-Path $PSScriptRoot "start-auto-publish-hidden.vbs"
$wscript = Join-Path $env:SystemRoot "System32\wscript.exe"
$workDir = $PSScriptRoot

$ws = New-Object -ComObject WScript.Shell
$shortcut = $ws.CreateShortcut($linkPath)
$shortcut.TargetPath = $wscript
$shortcut.Arguments = "//B `"$vbsPath`""
$shortcut.WorkingDirectory = $workDir
$shortcut.WindowStyle = 7
$shortcut.Description = "Auto commit and push hangout-website to GitHub (hidden)"
$shortcut.Save()

if (Test-Path $linkPath) {
  Write-Host "Installed: $linkPath"
  Write-Host ""
  Write-Host "Auto-publish will start HIDDEN on your next login."
  Write-Host "Log file: $workDir\logs\auto-publish.log"
  Write-Host ""
  Write-Host "To start it RIGHT NOW (hidden), run: start-auto-publish.bat"
  Write-Host "To stop it, run: stop-auto-publish.bat"
  exit 0
}

Write-Host "Install failed."
exit 1
