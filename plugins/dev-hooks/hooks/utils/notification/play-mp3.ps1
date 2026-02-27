param($FilePath)
Add-Type -AssemblyName presentationCore
$player = New-Object System.Windows.Media.MediaPlayer
$player.Open([System.Uri]"file:///$FilePath")
while (!$player.NaturalDuration.HasTimeSpan) { Start-Sleep -Milliseconds 100 }
Start-Sleep -Milliseconds 150
$player.Play()
Start-Sleep -Seconds $player.NaturalDuration.TimeSpan.TotalSeconds
Start-Sleep -Milliseconds 150
$player.Close()