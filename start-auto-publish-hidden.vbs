' Runs auto-publish.js hidden (no console window).
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

Set shell = CreateObject("WScript.Shell")
shell.CurrentDirectory = scriptDir

nodeCmd = "node """ & scriptDir & "\auto-publish.js"""
shell.Run nodeCmd, 0, False
