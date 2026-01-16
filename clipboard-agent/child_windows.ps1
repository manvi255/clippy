# Poll clipboard for file paths
Add-Type -AssemblyName System.Windows.Forms

while ($true) {
    $files = [Windows.Forms.Clipboard]::GetFileDropList()
    if ($files.Count -gt 0) {
        foreach ($f in $files) { Write-Output $f }
    }
    Start-Sleep -Seconds 1
}