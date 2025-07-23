<#
.SYNOPSIS
    byGOG-Lab HTML sayfasını indirir ve açar.
.DESCRIPTION
    Bu betik, byGOG-Lab.html'nin en son sürümünü GitHub'dan indirir,
    kullanıcının geçici dosyalar klasörüne kaydeder ve ardından
    varsayılan web tarayıcısında açar. Bu, mevcut çalışma dizinini
    kirletmeyi önler.
#>
$tempFile = Join-Path $env:TEMP "byGOG-Lab.html"
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/byGOG/byGOG-Lab/main/byGOG-Lab.html" -OutFile $tempFile
Start-Process -FilePath $tempFile