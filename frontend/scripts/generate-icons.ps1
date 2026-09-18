Add-Type -AssemblyName System.Drawing;

$sourcePath = "C:/Users/User/.gemini/antigravity-ide/brain/3a3babd8-5aa4-4328-b847-85c801ca9878/.user_uploaded/media_1789737727114.png";
$frontendRoot = "d:/LearnTrack/frontend";
$publicDir = "$frontendRoot/public";
$iconsDir = "$publicDir/icons";

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null;
}

# 1. Copy source 1024x1024 to public/logo.png
Copy-Item -Path $sourcePath -Destination "$publicDir/logo.png" -Force;
Write-Host "Copied to $publicDir/logo.png";

# Load source image
$srcImg = [System.Drawing.Bitmap]::FromFile($sourcePath);

function Resize-And-Save($targetPath, $targetWidth, $targetHeight) {
    $destBitmap = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight);
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap);
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality;
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality;
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality;

    $graphics.Clear([System.Drawing.Color]::Transparent);
    $graphics.DrawImage($srcImg, 0, 0, $targetWidth, $targetHeight);
    $graphics.Dispose();

    $destBitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png);
    $destBitmap.Dispose();
    Write-Host "Generated $targetPath ($targetWidth x $targetHeight)";
}

# 2. Generate icon sizes
Resize-And-Save "$iconsDir/icon-512x512.png" 512 512;
Resize-And-Save "$iconsDir/icon-maskable-512x512.png" 512 512;
Resize-And-Save "$iconsDir/icon-192x192.png" 192 192;
Resize-And-Save "$iconsDir/apple-touch-icon.png" 180 180;
Resize-And-Save "$publicDir/apple-touch-icon.png" 180 180;
Resize-And-Save "$iconsDir/favicon-32x32.png" 32 32;
Resize-And-Save "$iconsDir/favicon-16x16.png" 16 16;

# 3. Create favicon.ico (using 32x32 bitmap saved as icon)
$favBmp = New-Object System.Drawing.Bitmap(32, 32);
$favG = [System.Drawing.Graphics]::FromImage($favBmp);
$favG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;
$favG.DrawImage($srcImg, 0, 0, 32, 32);
$favG.Dispose();

$hIcon = $favBmp.GetHicon();
$icon = [System.Drawing.Icon]::FromHandle($hIcon);
$stream1 = [System.IO.File]::OpenWrite("$publicDir/favicon.ico");
$icon.Save($stream1);
$stream1.Close();

$stream2 = [System.IO.File]::OpenWrite("$frontendRoot/src/app/favicon.ico");
$icon.Save($stream2);
$stream2.Close();

$icon.Dispose();
$favBmp.Dispose();
$srcImg.Dispose();

Write-Host "Favicons generated successfully!";
