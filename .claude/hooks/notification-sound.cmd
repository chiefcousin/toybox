@echo off
REM Notification sound script for Claude Code - ToyBox Project
REM Plays a notification sound when Claude Code events occur

REM Play Windows system beep sound
powershell -Command "[System.Media.SystemSounds]::Beep.Play()"

REM Alternative: Play a custom sound file (uncomment and customize path)
REM powershell -Command "Add-Type -AssemblyName System.Media; (New-Object System.Media.SoundPlayer '%~dp0sounds\notification.wav').PlaySync()"

exit /b 0
