# Command Execution Security Rule (No PowerShell)

## Strict Constraint
- **NEVER** run raw PowerShell commands or execute scripts directly in PowerShell.
- Antivirus / EDR software on the host machine flags raw PowerShell invocations as malware / threat behavior.
- **ALWAYS** prefix and execute any terminal command using `cmd.exe /c "..."`.
  - Example: `cmd.exe /c "npm test"`
  - Example: `cmd.exe /c "git status"`
  - Example: `cmd.exe /c "npm run build"`
