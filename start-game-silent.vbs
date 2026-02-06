' Pençe Oyunu - Sessiz Başlatıcı (Arka planda çalışır)
Set WshShell = CreateObject("WScript.Shell")

' Proje dizinini al
Dim scriptPath
scriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)

' Batch dosyasını gizli modda çalıştır (pencere açmaz)
WshShell.Run """" & scriptPath & "\start-game.bat""", 0, False

' Bilgilendirme mesajı göster (isteğe bağlı - kaldırabilirsiniz)
MsgBox "Pençe Oyunu başlatılıyor..." & vbCrLf & vbCrLf & "Tarayıcınızda açılacak.", vbInformation + vbSystemModal, "Oyun Başlatıcı"
