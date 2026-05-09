$file = 'e:/Homedify/frontend/src/pages/AdminDashboard.jsx'
$content = [System.IO.File]::ReadAllText($file)
$content = $content.Replace('scroll={{ x: 880 }}', 'scroll={{ x: 740 }}')
[System.IO.File]::WriteAllText($file, $content)
Write-Host 'Done - scroll updated'
