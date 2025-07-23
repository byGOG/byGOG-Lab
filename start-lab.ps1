<#
.SYNOPSIS
    byGOG-Lab HTML sayfasını tarayıcıda açar.
.DESCRIPTION
    Bu betik, byGOG-Lab sayfasının en son sürümünü, dosyayı indirmeye
    gerek kalmadan, doğrudan varsayılan web tarayıcısında açar.
    Bu işlem için raw.githack.com servisi kullanılır.
#>
Start-Process -FilePath "https://raw.githack.com/byGOG/byGOG-Lab/main/byGOG-Lab.html"