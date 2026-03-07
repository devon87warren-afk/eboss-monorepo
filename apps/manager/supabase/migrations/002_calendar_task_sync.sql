-- Migration: Calendar and Task Sync Integration
-- Adds tables for calendar events, tasks, and sync configuration

-- Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('meeting', 'task', 'reminder', 'service', 'follow_up')),
  status TEXT NOT NULL CHECK (status IN ('tentative', 'confirmed', 'cancelled')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  organizer JSONB NOT NULL,
  reminder_minutes INTEGER,
  recurrence JSONB,
  related_account_id TEXT,
  related_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  related_unit_id TEXT,
  created_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_metadata JSONB NOT NULL DEFAULT '{
    "localId": "",
    "lastSyncedAt": "",
    "lastModifiedAt": "",
    "syncStatus": "pending",
    "sourceOfTruth": "local"
  }'::jsonb
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('notStarted', 'inProgress', 'completed', 'waitingOnOthers', 'deferred')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  reminder_date_time TIMESTAMPTZ,
  completed_date_time TIMESTAMPTZ,
  assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  related_account_id TEXT,
  related_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  related_unit_id TEXT,
  checklist_items JSONB DEFAULT '[]'::jsonb,
  created_by_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_metadata JSONB NOT NULL DEFAULT '{
    "localId": "",
    "lastSyncedAt": "",
    "lastModifiedAt": "",
    "syncStatus": "pending",
    "sourceOfTruth": "local"
  }'::jsonb
);

-- Sync Configurations Table
CREATE TABLE IF NOT EXISTS sync_configurations (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  outlook_enabled BOOLEAN DEFAULT FALSE,
  outlook_tenant_id TEXT,
  outlook_calendar_id TEXT,
  outlook_task_list_id TEXT,
  salesforce_enabled BOOLEAN DEFAULT FALSE,
  salesforce_instance_url TEXT,
  salesforce_user_id TEXT,
  sync_direction TEXT NOT NULL DEFAULT 'bidirectional' CHECK (sync_direction IN ('push', 'pull', 'bidirectional')),
  sync_frequency_minutes INTEGER DEFAULT 15,
  last_sync_at TIMESTAMPTZ,
  auto_sync_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync Conflicts Table
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  local_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('outlook', 'salesforce', 'local')),
  item_type TEXT NOT NULL CHECK (item_type IN ('event', 'task')),
  remote_data JSONB NOT NULL,
  local_data JSONB,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  resolved_at TIMESTAMPTZ,
  resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution TEXT CHECK (resolution IN ('local', 'outlook', 'salesforce')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_sync_status ON calendar_events((sync_metadata->>'syncStatus'));
CREATE INDEX IF NOT EXISTS idx_calendar_events_outlook_id ON calendar_events((sync_metadata->>'outlookId'));
CREATE INDEX IF NOT EXISTS idx_calendar_events_salesforce_id ON calendar_events((sync_metadata->>'salesforceId'));

CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sync_status ON tasks((sync_metadata->>'syncStatus'));
CREATE INDEX IF NOT EXISTS idx_tasks_outlook_id ON tasks((sync_metadata->>'outlookId'));
CREATE INDEX IF NOT EXISTS idx_tasks_salesforce_id ON tasks((sync_metadata->>'salesforceId'));

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_status ON sync_conflicts(status);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_detected_at ON sync_conflicts(detected_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_configurations_updated_at
  BEFORE UPDATE ON sync_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;

-- Calendar Events Policies
CREATE POLICY "Users can view their own calendar events"
  ON calendar_events FOR SELECT
  USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can create their own calendar events"
  ON calendar_events FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can update their own calendar events"
  ON calendar_events FOR UPDATE
  USING (auth.uid() = created_by_user_id);

CREATE POLICY "Users can delete their own calendar events"
  ON calendar_events FOR DELETE
  USING (auth.uid() = created_by_user_id);

-- Tasks Policies
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = created_by_user_id OR auth.uid() = assigned_to_user_id);

CREATE POLICY "Users can create their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = created_by_user_id);

CREATE POLICY "Users can update their own or assigned tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = created_by_user_id OR auth.uid() = assigned_to_user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = created_by_user_id);

-- Sync Configurations Policies
CREATE POLICY "Users can view their own sync configuration"
  ON sync_configurations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync configuration"
  ON sync_configurations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync configuration"
  ON sync_configurations FOR UPDATE
  USING (auth.uid() = user_id);

-- Sync Conflicts Policies
CREATE POLICY "Users can view sync conflicts for their items"
  ON sync_conflicts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events WHERE id = sync_conflicts.local_id AND created_by_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM tasks WHERE id = sync_conflicts.local_id AND created_by_user_id = auth.uid()
    )
  );

CREATE POLICY "System can create sync conflicts"
  ON sync_conflicts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update sync conflicts for their items"
  ON sync_conflicts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM calendar_events WHERE id = sync_conflicts.local_id AND created_by_user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM tasks WHERE id = sync_conflicts.local_id AND created_by_user_id = auth.uid()
    )
  );

-- Helper Views

-- View: Upcoming Events
CREATE OR REPLACE VIEW upcoming_events AS
SELECT
  e.*,
  u.name as creator_name
FROM calendar_events e
JOIN users u ON e.created_by_user_id = u.id
WHERE e.start_time >= NOW()
  AND e.status != 'cancelled'
ORDER BY e.start_time ASC;

-- View: Active Tasks
CREATE OR REPLACE VIEW active_tasks AS
SELECT
  t.*,
  creator.name as creator_name,
  assignee.name as assignee_name
FROM tasks t
JOIN users creator ON t.created_by_user_id = creator.id
LEFT JOIN users assignee ON t.assigned_to_user_id = assignee.id
WHERE t.status != 'completed'
ORDER BY
  CASE t.priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  t.due_date ASC NULLS LAST;

-- View: Overdue Tasks
CREATE OR REPLACE VIEW overdue_tasks AS
SELECT
  t.*,
  creator.name as creator_name,
  assignee.name as assignee_name
FROM tasks t
JOIN users creator ON t.created_by_user_id = creator.id
LEFT JOIN users assignee ON t.assigned_to_user_id = assignee.id
WHERE t.status != 'completed'
  AND t.due_date < NOW()
ORDER BY t.due_date ASC;

-- View: Pending Sync Conflicts
CREATE OR REPLACE VIEW pending_sync_conflicts AS
SELECT
  sc.*,
  CASE
    WHEN sc.item_type = 'event' THEN (SELECT title FROM calendar_events WHERE id = sc.local_id)
    WHEN sc.item_type = 'task' THEN (SELECT title FROM tasks WHERE id = sc.local_id)
  END as item_title
FROM sync_conflicts sc
WHERE sc.status = 'pending'
ORDER BY sc.detected_at DESC;

-- Comments for documentation
COMMENT ON TABLE calendar_events IS 'Unified calendar events from EBOSS, Outlook, and Salesforce';
COMMENT ON TABLE tasks IS 'Unified tasks from EBOSS, Outlook To Do, and Salesforce Tasks';
COMMENT ON TABLE sync_configurations IS 'Per-user sync settings for Outlook and Salesforce integration';
COMMENT ON TABLE sync_conflicts IS 'Tracks sync conflicts that need manual resolution';

COMMENT ON COLUMN calendar_events.sync_metadata IS 'JSON containing outlookId, salesforceId, lastSyncedAt, syncStatus, sourceOfTruth';
COMMENT ON COLUMN tasks.sync_metadata IS 'JSON containing outlookId, salesforceId, lastSyncedAt, syncStatus, sourceOfTruth';
COMMENT ON COLUMN tasks.checklist_items IS 'JSON array of checklist items with id, title, isCompleted, order';
