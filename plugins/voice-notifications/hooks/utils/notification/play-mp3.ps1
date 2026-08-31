param($FilePath, [double]$Volume = 0.5)
Add-Type -AssemblyName presentationCore
$player = New-Object System.Windows.Media.MediaPlayer
$player.Open([System.Uri]"file:///$FilePath")
$player.Volume = $Volume
while (!$player.NaturalDuration.HasTimeSpan) { Start-Sleep -Milliseconds 100 }
Start-Sleep -Milliseconds 150
$player.Play()
Start-Sleep -Seconds $player.NaturalDuration.TimeSpan.TotalSeconds
Start-Sleep -Milliseconds 150
$player.Close()