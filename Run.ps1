param(
    [switch]$Test,
    [switch]$BuildOnly,
    [string]$VisualStudioCodePath
)

$ErrorActionPreference = 'Stop'
$logFolderPath = Join-Path $PSScriptRoot ('MyLogOutput\' + (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'))
New-Item -ItemType Directory -Path $logFolderPath -Force | Out-Null
Start-Transcript -Path (Join-Path $logFolderPath 'Run.log') | Out-Null
$exitCode = 0
$previousElectronMode = $env:ELECTRON_RUN_AS_NODE
$previousTestOutput = $env:COPY_TEXT_LOCATION_TEST_OUTPUT

try {
    if (!$VisualStudioCodePath) {
        $codeCommand = Get-Command code -ErrorAction SilentlyContinue
        $candidates = @(
            "$env:LOCALAPPDATA\Programs\Microsoft VS Code\Code.exe",
            "$env:ProgramFiles\Microsoft VS Code\Code.exe"
        )
        if ($codeCommand) {
            $candidates = @((Join-Path (Split-Path (Split-Path $codeCommand.Source)) 'Code.exe')) + $candidates
        }
        $VisualStudioCodePath = $candidates | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } | Select-Object -First 1
    }
    if (!$VisualStudioCodePath -or !(Test-Path -LiteralPath $VisualStudioCodePath -PathType Leaf)) {
        throw 'Install Visual Studio Code, or pass -VisualStudioCodePath with the full path to Code.exe.'
    }
    $VisualStudioCodePath = (Resolve-Path -LiteralPath $VisualStudioCodePath).Path

    # Use VS Code's bundled Node.js so a separate Node.js installation is unnecessary.
    $env:ELECTRON_RUN_AS_NODE = '1'
    & $VisualStudioCodePath (Join-Path $PSScriptRoot 'Scripts\Build.js') 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { throw 'The extension build failed.' }
    & $VisualStudioCodePath --test (Join-Path $PSScriptRoot 'Tests\Extension.test.js') 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { throw 'The extension tests failed.' }
    $env:ELECTRON_RUN_AS_NODE = $null

    if (!$BuildOnly) {
        $profilePath = Join-Path $logFolderPath 'UserData'
        $settingsPath = Join-Path $profilePath 'User'
        New-Item -ItemType Directory -Path $settingsPath -Force | Out-Null
        '{"telemetry.telemetryLevel":"off","update.mode":"none","extensions.autoUpdate":false,"workbench.startupEditor":"none"}' |
            Set-Content -LiteralPath (Join-Path $settingsPath 'settings.json') -Encoding UTF8

        $arguments = @(
            '--new-window',
            '--disable-extensions',
            '--skip-welcome',
            '--skip-release-notes',
            '--disable-workspace-trust',
            ('--user-data-dir="' + $profilePath + '"'),
            ('--extensions-dir="' + (Join-Path $logFolderPath 'Extensions') + '"'),
            ('--logsPath="' + (Join-Path $logFolderPath 'VisualStudioCode') + '"'),
            ('--extensionDevelopmentPath="' + (Join-Path $PSScriptRoot 'Build\CopyTextLocation') + '"')
        )
        if ($Test) {
            $env:COPY_TEXT_LOCATION_TEST_OUTPUT = $logFolderPath
            $arguments += '--extensionTestsPath="' + (Join-Path $PSScriptRoot 'Tests\ExtensionHost.js') + '"'
        } else {
            $arguments += '"' + (Join-Path $PSScriptRoot 'Specification.md') + '"'
        }

        Write-Host "Session logs: $logFolderPath"
        $launchOptions = @{
            FilePath = $VisualStudioCodePath
            ArgumentList = $arguments
            PassThru = $true
            RedirectStandardOutput = (Join-Path $logFolderPath 'StandardOutput.log')
            RedirectStandardError = (Join-Path $logFolderPath 'StandardError.log')
        }
        if ($Test) { $launchOptions.WindowStyle = 'Hidden' }
        $process = Start-Process @launchOptions
        if ($Test) {
            # Retain the native handle so Windows PowerShell can read ExitCode after exit.
            $processHandle = $process.Handle
            if (!$process.WaitForExit(120000)) {
                Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
                throw 'The VS Code integration tests exceeded two minutes. See the session logs.'
            }
            if ($process.ExitCode -ne 0) { throw "VS Code integration tests failed (exit $($process.ExitCode))." }
            $resultPath = Join-Path $logFolderPath 'IntegrationResults.json'
            if (!(Test-Path -LiteralPath $resultPath)) { throw 'VS Code did not produce integration test results.' }
            $result = Get-Content -Raw -LiteralPath $resultPath | ConvertFrom-Json
            if (!$result.passed) { throw "Integration tests failed: $($result.error)" }
            Write-Host "Passed $($result.count) VS Code integration checks."
        }
    }
} catch {
    Write-Host $_ -ForegroundColor Red
    Write-Host "Session logs: $logFolderPath"
    $exitCode = 1
} finally {
    $env:ELECTRON_RUN_AS_NODE = $previousElectronMode
    $env:COPY_TEXT_LOCATION_TEST_OUTPUT = $previousTestOutput
    Stop-Transcript | Out-Null
}

if ($exitCode -ne 0 -and !$Test -and !$BuildOnly) {
    Read-Host 'Press Enter to close' | Out-Null
}
exit $exitCode
