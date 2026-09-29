$ErrorActionPreference='Stop'
Set-Location $PSScriptRoot
$logDir=Join-Path $PSScriptRoot '.git-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$log=Join-Path $logDir 'dual-push-last.log'
Start-Transcript -Path $log -Force | Out-Null
try {
 Write-Host '=== SETDA_DEV Dual Push ===' -ForegroundColor Cyan
 $branch=(git branch --show-current).Trim()
 if($branch -ne 'main'){ throw "Expected branch main, got $branch" }
 $dirty=git status --porcelain
 if($dirty){ throw 'Working tree is not clean. Commit changes before push.' }
 $head=(git rev-parse HEAD).Trim()
 Write-Host "HEAD: $head"
 Write-Host '[1/2] origin/main'
 git push -u origin main
 if($LASTEXITCODE -ne 0){ throw "origin push failed: $LASTEXITCODE" }
 Write-Host '[2/2] vsc/setda-dev'
 git push vsc HEAD:refs/heads/setda-dev
 if($LASTEXITCODE -ne 0){ throw "vsc push failed: $LASTEXITCODE" }
 Write-Host 'DUAL_PUSH_PASS' -ForegroundColor Green
 Write-Host "LOCAL_HEAD=$head"
} catch {
 Write-Host "DUAL_PUSH_FAIL: $($_.Exception.Message)" -ForegroundColor Red
 exit 1
} finally { Stop-Transcript | Out-Null }
