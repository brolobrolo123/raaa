Add-Type -AssemblyName System.Drawing
$base = Join-Path $PSScriptRoot "..\public\hud-icons"
$base = [System.IO.Path]::GetFullPath($base)
if (-not (Test-Path $base)) {
    New-Item -ItemType Directory -Path $base | Out-Null
}
$colors = @{
    home = [System.Drawing.Color]::FromArgb(255,52,211,153)
    publish = [System.Drawing.Color]::FromArgb(255,244,114,182)
    notifications = [System.Drawing.Color]::FromArgb(255,14,165,233)
    battle = [System.Drawing.Color]::FromArgb(255,192,132,252)
    market = [System.Drawing.Color]::FromArgb(255,34,197,94)
    ranking = [System.Drawing.Color]::FromArgb(255,251,191,36)
}
foreach ($entry in $colors.GetEnumerator()) {
    $bmp = New-Object System.Drawing.Bitmap 128,128
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    $brush = New-Object System.Drawing.SolidBrush ($entry.Value)
    $gfx.FillRectangle($brush,0,0,128,128)
    $brush.Dispose()
    $gfx.Dispose()
    $path = Join-Path $base ($entry.Key + ".png")
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}
