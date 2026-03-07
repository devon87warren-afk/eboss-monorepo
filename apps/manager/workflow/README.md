# Dynamic Workflow System

A configuration-driven system for building dynamic, role-based workflows and pages in EBOSS Manager.

## Overview

The workflow system allows you to define pages, forms, and workflows through TypeScript/JSON configuration instead of writing custom React components for each entity. This enables:

- **Rapid Development**: Create new pages by writing configuration, not code
- **Consistency**: All pages follow the same patterns and UI guidelines
- **Role-Based Access**: Show/hide UI elements based on user role
- **Workflow Automation**: Define state machines for entity lifecycles
- **Type Safety**: Full TypeScript support for configurations

## Quick Start

### 1. Define a Page Configuration

```typescript
import { PageConfig } from './types/WorkflowConfig';

const myListPage: PageConfig = {
  id: 'my-list',
  type: 'list',
  title: 'My Entities',
  dataSource: {
    entity: 'myEntity',
    queryKey: ['myEntity'],
  },
  layout: {
    type: 'list',
    columns: [
      { key: 'id', label: 'ID', type: 'text', sortable: true },
      { key: 'name', label: 'Name', type: 'text', sortable: true },
      { key: 'status', label: 'Status', type: 'status' },
    ],
    filters: [
      { key: 'status', label: 'Status', type: 'select', options: [...] },
    ],
    searchFields: ['name', 'description'],
  },
  actions: [
    {
      id: 'create',
      label: 'Create New',
      type: 'navigate',
      handler: { to: '/my-entity/new' },
    },
  ],
};
```

### 2. Use GenericListPage

```typescript
import GenericListPage from './workflow/templates/GenericListPage';

const MyPage = () => <GenericListPage config={myListPage} />;
```

### 3. Define a Workflow

```typescript
import { WorkflowDefinition } from './types/WorkflowConfig';

const myWorkflow: WorkflowDefinition = {
  id: 'my-workflow',
  entity: 'myEntity',
  statusField: 'status',
  initialState: 'draft',
  states: [
    { id: 'draft', label: 'Draft', type: 'initial' },
    { id: 'published', label: 'Published', type: 'final' },
  ],
  transitions: [
    {
      id: 'publish',
      from: 'draft',
      to: 'published',
      label: 'Publish',
      trigger: 'manual',
    },
  ],
};
```

### 4. Use Workflow in Components

```typescript
import { useWorkflow } from './workflow/hooks/useWorkflow';

const MyComponent = ({ entity }) => {
  const { availableTransitions, executeTransition } = useWorkflow({
    workflowId: 'my-workflow',
    entity,
    queryKey: ['myEntity', entity.id],
  });

  return (
    <div>
      {availableTransitions.map(t => (
        <button key={t.id} onClick={() => executeTransition(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
};
```

## Architecture

### Directory Structure

```
workflow/
├── types/               # TypeScript type definitions
│   └── WorkflowConfig.ts
├── templates/           # Generic page templates
│   └── GenericListPage.tsx
├── configs/             # Page and workflow configurations
│   └── ticketWorkflow.config.ts
├── registry/            # Component registry for dynamic loading
│   ├── ComponentRegistry.ts
│   └── ComponentResolver.tsx
├── engine/              # Workflow state machine
│   └── WorkflowEngine.ts
├── hooks/               # React hooks
│   ├── useRoleAccess.ts
│   └── useWorkflow.ts
├── utils/               # Utility functions
│   ├── dataResolver.ts
│   ├── cellRenderers.tsx
│   └── actionExecutor.ts
└── demo/                # Example implementations
    └── TicketListDemo.tsx
```

### Key Components

#### 1. GenericListPage

Renders a data table with filtering, sorting, pagination, and actions from configuration.

**Features:**
- Configurable columns with custom renderers
- Filter panel with multiple field types
- Search across specified fields
- Role-based column and action visibility
- Row selection and bulk actions
- Pagination support

#### 2. WorkflowEngine

State machine for managing entity lifecycles with transitions, guards, and hooks.

**Features:**
- Define states and transitions
- Role-based transition permissions
- Guard functions for conditional transitions
- Required field validation
- Pre/post transition hooks
- Audit logging support

#### 3. Component Registry

Lazy-loading system for dynamically resolving components from string keys.

**Features:**
- Register components by key
- Lazy loading for performance
- Category-based organization
- Custom renderers for table cells and form fields

## Configuration Reference

### PageConfig

Defines a complete page layout.

```typescript
interface PageConfig {
  id: string;                    // Unique page identifier
  type: PageLayoutType;          // 'list' | 'detail' | 'form' | 'dashboard' | 'wizard'
  title: string;                 // Page title
  subtitle?: string;             // Optional subtitle
  dataSource: DataSourceConfig;  // Data fetching configuration
  layout: Layout;                // Layout-specific configuration
  actions?: ActionConfig[];      // Page-level actions
  roles?: UserRole[];            // Who can access this page
}
```

### ListPageLayout

Configuration for list/table pages.

```typescript
interface ListPageLayout {
  type: 'list';
  columns: ColumnConfig[];       // Table columns
  filters: FilterFieldConfig[];  // Filter panel fields
  searchFields?: string[];       // Fields to search across
  pagination?: PaginationConfig; // Pagination settings
  selectable?: boolean;          // Enable row selection
  rowActions?: ActionConfig[];   // Actions per row
  bulkActions?: ActionConfig[];  // Actions for selected rows
}
```

### WorkflowDefinition

Defines a state machine for entity lifecycles.

```typescript
interface WorkflowDefinition {
  id: string;                      // Unique workflow identifier
  entity: string;                  // Entity type this applies to
  statusField: string;             // Field containing current state
  initialState: string;            // Starting state ID
  states: WorkflowStateConfig[];   // All possible states
  transitions: TransitionConfig[]; // Allowed transitions
  hooks?: WorkflowHookConfig[];    // Global hooks
}
```

## Role-Based Access Control

All configuration elements support role-based visibility:

```typescript
{
  columns: [
    {
      key: 'sensitiveData',
      label: 'Sensitive',
      type: 'text',
      roles: [UserRole.ADMIN],  // Only admins see this column
    },
  ],
  actions: [
    {
      id: 'delete',
      label: 'Delete',
      type: 'api',
      roles: [UserRole.ADMIN, UserRole.MANAGER],  // Only admins/managers
    },
  ],
}
```

Use the `useRoleAccess` hook to filter items:

```typescript
const { filterByRole } = useRoleAccess();
const visibleColumns = filterByRole(config.columns);
```

## Examples

### Example 1: Ticket List Page

See [ticketWorkflow.config.ts](./configs/ticketWorkflow.config.ts) for a complete example including:
- List page with 7 columns
- Status and priority filters
- Search across multiple fields
- Row and bulk actions
- Role-based action visibility

### Example 2: Using in a Component

```typescript
import { GenericListPage, ticketListPage } from './workflow';

const TicketsPage = () => <GenericListPage config={ticketListPage} />;
```

### Example 3: Custom Cell Renderer

```typescript
// Register custom renderer
ComponentRegistry.register('MyCustomCell', {
  component: MyCustomCellComponent,
  displayName: 'Custom Cell',
  category: 'cell',
});

// Use in column configuration
{
  key: 'myField',
  label: 'My Field',
  type: 'custom',
  render: 'MyCustomCell',  // References registered component
}
```

## Integration with Existing Code

The workflow system is designed for **backward compatibility**:

1. **Parallel Systems**: Dynamic pages run alongside existing hard-coded pages
2. **Progressive Migration**: Migrate one page at a time
3. **Shared Components**: Both systems use the same UI component library
4. **Shared Context**: Uses existing AppContext, RightPanelContext, etc.

## API Requirements

For the workflow system to work with an entity, your API must provide:

```typescript
{
  getAll: (params: { page, pageSize }) => Promise<{ data, total, hasMore }>,
  getById: (id: string) => Promise<Entity>,
  create: (data: Partial<Entity>) => Promise<Entity>,
  update: (id: string, data: Partial<Entity>) => Promise<Entity>,
  delete: (id: string) => Promise<void>,
}
```

Register your API in [dataResolver.ts](./utils/dataResolver.ts):

```typescript
const apiMap = {
  'myEntity': myEntityApi,
};
```

## Future Enhancements

- [ ] GenericDetailPage template
- [ ] GenericFormPage template
- [ ] GenericDashboard template
- [ ] WorkflowWizard template
- [ ] DynamicRouter for config-driven routing
- [ ] Form field library (file upload, date picker, etc.)
- [ ] Widget library for dashboards
- [ ] Workflow visualization UI
- [ ] Configuration UI builder

## License

Internal use only - ANA Energy EBOSS Manager
