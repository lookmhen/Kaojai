# Project Guidelines & Rules - KaoJai

## Terminal Execution Security
- **DO NOT USE POWERSHELL DIRECTLY**: The user's system runs EDR / Antivirus software that flags raw PowerShell commands as malware alerts.
- **ALWAYS EXECUTE COMMANDS VIA `cmd.exe /c "..."`**: Every command run through `run_command` must use `cmd.exe /c "<command>"`.
