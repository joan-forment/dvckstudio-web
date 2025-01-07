# Registers a Windows scheduled task that asks Claude Code for one new blog
# draft every day (npm run blog:draft), as long as fewer than $MaxQueue drafts
# are waiting. Nothing is published: drafts still need `npm run blog` and an OK.
#
#   Activate:   powershell -ExecutionPolicy Bypass -File scripts/blog/programar-borrador-diario.ps1
#   Change time: add -Hora "08:30"
#   Remove:     powershell -ExecutionPolicy Bypass -File scripts/blog/programar-borrador-diario.ps1 -Quitar

param(
  [string]$Hora = "09:00",
  [int]$MaxQueue = 10,
  [switch]$Quitar
)

$TaskName = "DvckStudio - borrador diario del blog"

if ($Quitar) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "Tarea eliminada: $TaskName"
  exit 0
}

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$LogDir = Join-Path $Root "content\blog\logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# cmd /c so npm and claude resolve from the user's PATH; output is appended
# to one log so a failed run can be checked afterwards.
$Command = "cd /d `"$Root`" && npm run blog:draft -- $MaxQueue >> `"$LogDir\borrador-diario.log`" 2>&1"
$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c $Command"
$Trigger = New-ScheduledTaskTrigger -Daily -At $Hora
# Runs later if the computer was off at that time; needs a network connection.
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1)

Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings `
  -Description "Escribe un borrador nuevo para el blog de dvckstudio.com con Claude Code (no publica nada)." -Force | Out-Null

Write-Host "Tarea programada: '$TaskName' cada día a las $Hora (máximo $MaxQueue borradores en cola)."
Write-Host "Registros en: $LogDir"
