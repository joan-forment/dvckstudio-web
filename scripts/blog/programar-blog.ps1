# Registers the two Windows scheduled tasks of the daily blog, Monday to Friday:
#   07:00  npm run blog:propose   10 current topics waiting in the studio
#   09:00  npm run blog:release   publishes the post scheduled for today and uploads it
# and puts an "Estudio del blog" shortcut on the desktop (npm run blog:studio).
# Both tasks run later if the computer was off or asleep at that time.
#
#   Activate:     powershell -ExecutionPolicy Bypass -File scripts/blog/programar-blog.ps1
#   Other times:  add -Propuestas "07:30" -Publicacion "10:00"
#   Remove:       powershell -ExecutionPolicy Bypass -File scripts/blog/programar-blog.ps1 -Quitar

param(
  [string]$Propuestas = "07:00",
  [string]$Publicacion = "09:00",
  [switch]$Quitar
)

$Tasks = @{
  "DvckStudio - propuestas del blog" = @{ Time = $Propuestas; Script = "blog:propose"; Log = "propuestas.log"; Description = "Busca 10 temas de actualidad para el blog de dvckstudio.com (no publica nada)." }
  "DvckStudio - publicar el blog"    = @{ Time = $Publicacion; Script = "blog:release"; Log = "publicacion.log"; Description = "Publica en dvckstudio.com el artículo programado para hoy en el estudio del blog." }
}
$Shortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "Estudio del blog.lnk"

if ($Quitar) {
  foreach ($name in $Tasks.Keys) { Unregister-ScheduledTask -TaskName $name -Confirm:$false -ErrorAction SilentlyContinue }
  Remove-Item $Shortcut -ErrorAction SilentlyContinue
  Write-Host "Tareas y acceso directo eliminados."
  exit 0
}

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$LogDir = Join-Path $Root "content\studio\logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$Weekdays = "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"
# Runs later if missed, wakes the computer from sleep, needs the network.
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -RunOnlyIfNetworkAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1)

foreach ($name in $Tasks.Keys) {
  $task = $Tasks[$name]
  # cmd /c so npm and claude resolve from the user's PATH; output goes to a log.
  $Command = "cd /d `"$Root`" && npm run $($task.Script) >> `"$LogDir\$($task.Log)`" 2>&1"
  $Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c $Command"
  $Trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Weekdays -At $task.Time
  Register-ScheduledTask -TaskName $name -Action $Action -Trigger $Trigger -Settings $Settings -Description $task.Description -Force | Out-Null
  Write-Host "Tarea programada: '$name' de lunes a viernes a las $($task.Time)."
}

$Shell = New-Object -ComObject WScript.Shell
$Link = $Shell.CreateShortcut($Shortcut)
$Link.TargetPath = "cmd.exe"
$Link.Arguments = "/k cd /d `"$Root`" && npm run blog:studio"
$Link.WorkingDirectory = $Root
$Link.IconLocation = Join-Path $Root "public\favicon.ico"
$Link.Description = "Abre el estudio del blog de DvckStudio"
$Link.Save()

Write-Host "Acceso directo en el escritorio: Estudio del blog"
Write-Host "Registros en: $LogDir"
