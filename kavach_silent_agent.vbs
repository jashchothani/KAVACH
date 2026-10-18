' KAVACH Silent Agent Launcher
' Launches KavachCollectorAgent.exe or pythonw collector_agent_entry.py with 0 window visibility
Dim objShell, fso, currentDir, agentExe

Set objShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

agentExe = currentDir & "\KavachCollectorAgent.exe"

If fso.FileExists(agentExe) Then
    objShell.Run Chr(34) & agentExe & Chr(34) & " --startup --silent", 0, False
Else
    Dim pywExe, scriptPath
    pywExe = currentDir & "\backend\.venv\Scripts\pythonw.exe"
    scriptPath = currentDir & "\backend\collector_agent_entry.py"
    If Not fso.FileExists(pywExe) Then
        pywExe = "pythonw.exe"
    End If
    objShell.Run Chr(34) & pywExe & Chr(34) & " " & Chr(34) & scriptPath & Chr(34) & " --startup --silent", 0, False
End If

Set objShell = Nothing
Set fso = Nothing
