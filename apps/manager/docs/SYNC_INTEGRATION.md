
# Calendar and Task Sync Integration

## Overview

EBOSS Manager now supports unified synchronization with **Microsoft Outlook** and **Salesforce**, consolidating your calendar events and tasks into a single interface. This eliminates the need to switch between multiple applications.

## Features

### ✅ Calendar Integration
- **Unified Calendar View**: Month, week, and day views showing events from all sources
- **Outlook Calendar Sync**: Two-way sync with Microsoft 365 Calendar
- **Salesforce Events Sync**: Two-way sync with Salesforce Events
- **Event Management**: Create, edit, and delete events with automatic sync
- **Conflict Resolution**: Smart handling of conflicting changes

### ✅ Task Management
- **Unified Task List**: All tasks from Outlook To Do, Salesforce Tasks, and EBOSS in one place
- **Smart Filtering**: Filter by source, status, priority, due date
- **Group & Sort**: Organize tasks by status, priority, source, or due date
- **Checklist Support**: Sub-tasks and checklist items
- **Bulk Operations**: Batch update and resolve conflicts

### ✅ Sync Features
- **Bidirectional Sync**: Changes sync both ways automatically
- **Conflict Detection**: Automatically detects when the same item is modified in multiple places
- **Manual Resolution**: Review and resolve conflicts with side-by-side comparison
- **Auto-Sync**: Configurable automatic sync intervals (5-120 minutes)
- **Sync Status Indicators**: Visual indicators showing sync status for each item

## Setup Instructions

### 1. Microsoft Outlook Integration

#### Prerequisites
- Microsoft 365 account with Calendar and Tasks enabled
- Azure AD application registration (for OAuth 2.0)

#### Configuration

1. **Create Azure AD Application**:
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to Azure Active Directory → App Registrations
   - Click "New registration"
   - Name: "EBOSS Manager"
   - Redirect URI: `http://localhost:3000` (or your production URL)
   - Click "Register"

2. **Configure API Permissions**:
   - Go to "API permissions"
   - Add the following Microsoft Graph permissions:
     - `Calendars.ReadWrite` (Delegated)
     - `Tasks.ReadWrite` (Delegated)
     - `User.Read` (Delegated)
     - `offline_access` (Delegated)
   - Click "Grant admin consent"

3. **Get Credentials**:
   - Go to "Overview" and copy the **Application (client) ID**
   - Go to "Certificates & secrets"
   - Create a new client secret
   - Copy the secret value immediately (it won't be shown again)

4. **Add to Environment Variables**:
   ```bash
   # .env file
   VITE_OUTLOOK_CLIENT_ID=your_client_id_here
   VITE_OUTLOOK_CLIENT_SECRET=your_client_secret_here
   VITE_OUTLOOK_REDIRECT_URI=http://localhost:3000
   ```

5. **Connect in EBOSS Manager**:
   - Go to Settings → Sync Settings
   - Click "Connect Outlook"
   - Sign in with your Microsoft account
   - Grant permissions when prompted

### 2. Salesforce Integration

#### Prerequisites
- Salesforce account with API access
- Salesforce Connected App

#### Configuration

1. **Create Connected App in Salesforce**:
   - Go to Setup → Apps → App Manager
   - Click "New Connected App"
   - Fill in basic information:
     - Connected App Name: "EBOSS Manager"
     - Contact Email: your email
   - Enable OAuth Settings:
     - Callback URL: `http://localhost:3000/sf-callback` (or your production URL)
     - Selected OAuth Scopes:
       - `Access and manage your data (api)`
       - `Perform requests on your behalf at any time (refresh_token, offline_access)`
   - Click "Save"

2. **Get Credentials**:
   - After saving, click "Manage Consumer Details"
   - Copy the **Consumer Key** (Client ID)
   - Copy the **Consumer Secret** (Client Secret)

3. **Add to Environment Variables**:
   ```bash
   # .env file
   VITE_SF_CLIENT_ID=your_salesforce_client_id
   VITE_SF_CLIENT_SECRET=your_salesforce_client_secret
   VITE_SF_REDIRECT_URI=http://localhost:3000/sf-callback
   VITE_SF_SANDBOX=false  # Set to 'true' for sandbox environments
   ```

4. **Connect in EBOSS Manager**:
   - Go to Settings → Sync Settings
   - Click "Connect Salesforce"
   - Sign in to Salesforce
   - Click "Allow" to grant access

### 3. Database Setup

Run the migration to create necessary tables:

```bash
# Using Supabase CLI
supabase migration up

# Or run the SQL manually
psql -h your-db-host -d your-database -f supabase/migrations/002_calendar_task_sync.sql
```

This creates the following tables:
- `calendar_events` - Unified calendar events
- `tasks` - Unified tasks
- `sync_configurations` - Per-user sync settings
- `sync_conflicts` - Conflict tracking

## Usage Guide

### Calendar View

#### Accessing the Calendar
1. Navigate to the Calendar page
2. Choose your preferred view: Month, Week, or Day
3. Events from all sources (Local, Outlook, Salesforce) appear in the unified calendar

#### Creating Events
1. Click "New Event" or click on a date/time slot
2. Fill in event details:
   - Title (required)
   - Description
   - Start and end times
   - Location
   - Attendees
   - Reminders
3. Choose where to create the event (Local, Outlook, Salesforce)
4. Click "Save" - the event will automatically sync

#### Event Color Coding
- **Blue**: Meetings
- **Purple**: Tasks
- **Amber**: Reminders
- **Emerald**: Service events
- **Rose**: Follow-ups

#### Sync Indicators
- **Green border**: Successfully synced
- **Amber border**: Pending sync
- **Red border**: Sync error or conflict
- **Cloud icon**: Synced with Outlook or Salesforce

### Task Management

#### Accessing Tasks
1. Navigate to the Tasks page
2. View all tasks from Local, Outlook To Do, and Salesforce Tasks

#### Filtering Tasks
- **All Tasks**: View everything
- **Today**: Tasks due today
- **Upcoming**: Future tasks
- **Overdue**: Past due tasks
- **Completed**: Finished tasks

#### Grouping Options
- **By Status**: Group by Not Started, In Progress, etc.
- **By Priority**: Group by Urgent, High, Medium, Low
- **By Source**: Group by Local, Outlook, Salesforce
- **By Due Date**: Group by Overdue, Today, Tomorrow, etc.

#### Creating Tasks
1. Click "New Task"
2. Fill in task details:
   - Title (required)
   - Description
   - Status (Not Started, In Progress, etc.)
   - Priority (Low, Medium, High, Urgent)
   - Due date
   - Assigned to
   - Checklist items (optional)
3. Save - the task will sync automatically

#### Task Status Updates
- Click the checkbox to mark tasks as complete
- Click on a task to edit details
- Drag tasks (in some views) to reprioritize

### Sync Management

#### Manual Sync
- Click the "Sync" button in Calendar or Tasks view
- Wait for sync to complete (progress indicator shown)
- Check for any conflicts that need resolution

#### Auto-Sync Configuration
1. Go to Settings → Sync Settings
2. Enable "Automatic sync"
3. Choose sync frequency:
   - Every 5 minutes (frequent updates)
   - Every 15 minutes (recommended)
   - Every 30 minutes
   - Every hour
   - Every 2 hours

#### Sync Direction
Choose how data flows:
- **Pull Only**: Import from Outlook/Salesforce to EBOSS (read-only)
- **Push Only**: Export from EBOSS to Outlook/Salesforce
- **Bidirectional**: Full two-way sync (recommended)

### Conflict Resolution

#### When Conflicts Occur
Conflicts happen when the same event/task is modified in multiple places between syncs.

#### Resolving Conflicts
1. Navigate to Settings → Sync Conflicts
2. Review the list of pending conflicts
3. Click on a conflict to see details
4. Compare the **Local Version** and **Remote Version** side-by-side
5. Choose which version to keep:
   - "Keep Local Version" - Use EBOSS Manager's version
   - "Keep Remote Version" - Use Outlook/Salesforce version
6. The other version will be overwritten

#### Bulk Resolution
- "Keep All Local" - Use EBOSS version for all conflicts
- "Keep All Remote" - Use Outlook/Salesforce version for all conflicts

## Data Mapping

### Outlook ↔ EBOSS

| Outlook Field | EBOSS Field | Notes |
|---------------|-------------|-------|
| `subject` | `title` | Event/task title |
| `start.dateTime` | `startTime` | Event start time |
| `end.dateTime` | `endTime` | Event end time |
| `location.displayName` | `location` | Event location |
| `bodyPreview` | `description` | Description/notes |
| `importance` | `priority` | low → low, normal → medium, high → high |
| `status` | `status` | Task completion status |
| `reminderDateTime` | `reminderDateTime` | Reminder time |

### Salesforce ↔ EBOSS

| Salesforce Field | EBOSS Field | Notes |
|------------------|-------------|-------|
| `Subject` | `title` | Event/task subject |
| `StartDateTime` | `startTime` | Event start |
| `EndDateTime` | `endTime` | Event end |
| `Location` | `location` | Event location |
| `Description` | `description` | Details |
| `Priority` | `priority` | Low, Normal, High |
| `Status` | `status` | Not Started, In Progress, Completed, etc. |
| `WhatId` | `relatedAccountId` | Linked Account/Opportunity |
| `WhoId` | Contact reference | Contact/Lead link |

## Troubleshooting

### Outlook Not Connecting
**Issue**: "Failed to connect to Outlook"

**Solutions**:
1. Verify Azure AD app credentials are correct
2. Check that redirect URI matches exactly
3. Ensure API permissions are granted
4. Try clearing browser cache and reconnecting
5. Check browser console for detailed error messages

### Salesforce Not Connecting
**Issue**: "Failed to connect to Salesforce"

**Solutions**:
1. Verify Connected App credentials
2. Check callback URL matches
3. Ensure user has API access permissions
4. For sandbox, ensure `VITE_SF_SANDBOX=true`
5. Check Salesforce IP restrictions/security settings

### Sync Not Working
**Issue**: "Items not syncing"

**Solutions**:
1. Check sync is enabled in Settings → Sync Settings
2. Verify auto-sync frequency is set
3. Click manual "Sync" button to trigger immediately
4. Check browser console for sync errors
5. Review sync conflicts - unresolved conflicts block syncing

### Conflicts Keep Appearing
**Issue**: "Same items keep conflicting"

**Solutions**:
1. Ensure auto-sync is enabled with reasonable frequency (15-30 min)
2. Avoid editing the same item in multiple places simultaneously
3. Let auto-sync complete before making additional changes
4. Choose bidirectional sync direction for best results

### Missing Events/Tasks
**Issue**: "Some items not showing up"

**Solutions**:
1. Check date range filters in Calendar view
2. Verify source filters (All Sources vs specific)
3. Check that items aren't filtered out by status
4. Try manual sync to refresh data
5. Check that the item exists in the original source (Outlook/Salesforce)

## API Rate Limits

### Microsoft Graph API
- Default: 10,000 requests per 10 minutes per user
- EBOSS Manager uses batching to minimize requests
- Auto-sync at 15-minute intervals stays well within limits

### Salesforce API
- Developer/Free: 5,000 requests per 24 hours
- Professional: 5,000-15,000 requests per 24 hours
- Enterprise: 25,000-100,000+ requests per 24 hours
- EBOSS Manager uses efficient SOQL queries
- Recommended: 30-minute sync frequency for free tiers

## Best Practices

### 1. Initial Setup
- Connect one service at a time
- Test with a small dataset first
- Review initial sync results before enabling auto-sync
- Set up conflict resolution strategy

### 2. Ongoing Use
- Use bidirectional sync for seamless experience
- Set auto-sync to 15-30 minutes for balance
- Review sync conflicts promptly
- Keep descriptions/notes consistent across platforms

### 3. Performance
- Limit sync to last 1-3 months for calendar events
- Archive old completed tasks
- Resolve conflicts regularly to prevent backlog
- Use appropriate sync frequency based on usage

### 4. Data Organization
- Use consistent naming conventions
- Link related items (events to accounts, tasks to tickets)
- Set priorities appropriately for task sorting
- Use categories/tags consistently

## Security & Privacy

### Authentication
- OAuth 2.0 for secure authentication
- Tokens stored in browser localStorage
- Automatic token refresh
- Tokens expire after inactivity

### Data Storage
- Synced data stored in Supabase PostgreSQL
- Row-level security (RLS) enforces access control
- Users can only access their own data
- Encryption in transit (HTTPS) and at rest

### Permissions
- Minimum required permissions requested
- Users can revoke access anytime
- Disconnecting removes all tokens
- Local data preserved when disconnecting

## Support

### Getting Help
- Check this documentation first
- Review browser console for error messages
- Check Supabase logs for backend errors
- Review Azure AD/Salesforce audit logs

### Reporting Issues
- Describe the issue in detail
- Include steps to reproduce
- Provide error messages/screenshots
- Specify which integration (Outlook/Salesforce)

## Changelog

### Version 1.0.0
- ✅ Initial release
- ✅ Outlook Calendar sync
- ✅ Outlook Tasks (Microsoft To Do) sync
- ✅ Salesforce Events sync
- ✅ Salesforce Tasks sync
- ✅ Unified Calendar view (Month/Week/Day)
- ✅ Unified Task management
- ✅ Conflict detection and resolution
- ✅ Auto-sync with configurable intervals
- ✅ Sync status indicators

### Roadmap
- 🔄 Google Calendar integration
- 🔄 Teams meeting support
- 🔄 Recurring events advanced patterns
- 🔄 Task dependencies
- 🔄 Mobile app support
- 🔄 Offline mode with sync queue
