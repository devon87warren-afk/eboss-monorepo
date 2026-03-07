---
description: Sync AI conversation history across devices using OneDrive
---

# Global Chat Sync Workflow

This workflow sets up automatic synchronization of your AI conversation history (`.gemini` folder) across all devices logged into the same Microsoft/OneDrive account.

## Prerequisites
- OneDrive installed and syncing on all devices
- Same Microsoft account on all devices
- PowerShell (Admin) access

---

## One-Time Setup (Run on Each Device)

### Step 1: Create the Cloud Folder (First Device Only)
// turbo
```powershell
# Create the shared folder in OneDrive
New-Item -Path "$env:USERPROFILE\OneDrive\GeminiSync" -ItemType Directory -Force
```

### Step 2: Move Existing Data to Cloud (First Device Only)
```powershell
# Move your existing .gemini folder to OneDrive
Move-Item -Path "$env:USERPROFILE\.gemini" -Destination "$env:USERPROFILE\OneDrive\GeminiSync\.gemini" -Force
```

### Step 3: Create Symlink (All Devices)
```powershell
# Create a symlink from the original location to the cloud folder
# MUST RUN AS ADMINISTRATOR
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\.gemini" -Target "$env:USERPROFILE\OneDrive\GeminiSync\.gemini"
```

---

## Verification
// turbo
```powershell
# Verify the symlink was created correctly
Get-Item "$env:USERPROFILE\.gemini" | Select-Object Name, LinkType, Target
```

Expected output:
```
Name    LinkType     Target
----    --------     ------
.gemini SymbolicLink {C:\Users\User\OneDrive\GeminiSync\.gemini}
```

---

## How It Works

```
Device A                          OneDrive Cloud                      Device B
┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
│ C:\Users\...    │              │                 │              │ C:\Users\...    │
│ \.gemini (link) │ ──syncs──▶  │ GeminiSync\     │  ◀──syncs── │ \.gemini (link) │
│                 │              │ .gemini\        │              │                 │
└─────────────────┘              └─────────────────┘              └─────────────────┘
```

1. **Symlink:** Your local `.gemini` folder is actually a pointer to the OneDrive folder.
2. **OneDrive Sync:** OneDrive automatically syncs changes to the cloud.
3. **Cross-Device:** Other devices with the same symlink structure pull the same data.

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "Access Denied" when creating symlink | Run PowerShell as Administrator |
| Symlink exists but empty | Wait for OneDrive to finish syncing |
| Conflicts on two devices editing same file | OneDrive will create conflict copies—manually merge |

---

## Rollback (If Needed)
```powershell
# Remove the symlink (does NOT delete cloud data)
Remove-Item "$env:USERPROFILE\.gemini" -Force

# Copy data back locally (optional)
Copy-Item -Path "$env:USERPROFILE\OneDrive\GeminiSync\.gemini" -Destination "$env:USERPROFILE\.gemini" -Recurse
```
