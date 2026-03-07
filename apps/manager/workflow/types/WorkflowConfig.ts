import { UserRole } from '../../types';
import { z } from 'zod';

// --- Core Building Blocks ---

export type PageLayoutType =
  | 'list'
  | 'detail'
  | 'form'
  | 'dashboard'
  | 'wizard';

export interface RouteConfig {
  path: string;
  pageId: string;
  title: string;
  icon?: string; // Lucide icon name
  showInNav?: boolean;
  navOrder?: number;
  roles?: UserRole[]; // Empty = all roles
  children?: RouteConfig[];
}

export interface PageConfig {
  id: string;
  type: PageLayoutType;
  title: string;
  subtitle?: string;
  dataSource: DataSourceConfig;
  layout: ListPageLayout | DetailPageLayout | FormPageLayout | DashboardLayout | WizardLayout;
  actions?: ActionConfig[];
  roles?: UserRole[];
}

// --- Data Source Configuration ---

export interface DataSourceConfig {
  entity: string; // 'units' | 'tickets' | 'customers' | etc.
  endpoint?: string; // Custom endpoint override
  queryKey: string[];
  defaultFilters?: Record<string, unknown>;
  defaultSort?: { field: string; direction: 'asc' | 'desc' };
  relations?: string[]; // Related entities to fetch
}

// --- Layout Configurations ---

export interface ListPageLayout {
  type: 'list';
  viewModes?: ('table' | 'grid' | 'cards')[];
  defaultView?: 'table' | 'grid' | 'cards';
  columns: ColumnConfig[];
  filters: FilterFieldConfig[];
  searchFields?: string[];
  pagination?: { defaultPageSize: number; pageSizes: number[] };
  selectable?: boolean;
  rowActions?: ActionConfig[];
  bulkActions?: ActionConfig[];
}

export interface DetailPageLayout {
  type: 'detail';
  idParam: string;
  headerFields: FieldDisplayConfig[];
  tabs: TabConfig[];
  sidebarSections?: SidebarSectionConfig[];
  actions?: ActionConfig[];
}

export interface FormPageLayout {
  type: 'form';
  mode: 'create' | 'edit' | 'both';
  idParam?: string; // For edit mode
  sections: FormSectionConfig[];
  submitAction: ActionConfig;
  cancelAction?: ActionConfig;
  validation?: ValidationConfig;
}

export interface DashboardLayout {
  type: 'dashboard';
  grid: { columns: number; gap: string };
  widgets: WidgetConfig[];
}

export interface WizardLayout {
  type: 'wizard';
  steps: WizardStepConfig[];
  navigation: 'linear' | 'free';
  persistState?: boolean;
  onComplete: ActionConfig;
}

// --- Column & Field Configuration ---

export interface ColumnConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'status' | 'badge' | 'link' | 'custom';
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: string; // Component registry key for custom render
  format?: FormatConfig;
  visible?: boolean;
  roles?: UserRole[];
}

export interface FieldDisplayConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'status' | 'link' | 'image' | 'custom';
  format?: FormatConfig;
  icon?: string;
  roles?: UserRole[];
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'date' |
        'datetime' | 'checkbox' | 'radio' | 'file' | 'image' | 'custom';
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
  disabled?: boolean | string; // string = condition expression
  hidden?: boolean | string;
  options?: SelectOptionConfig[] | string; // string = dynamic lookup key
  validation?: FieldValidationConfig;
  helpText?: string;
  dependsOn?: string[]; // Field names this depends on
  onChange?: string; // Handler key for dynamic behavior
  render?: string; // Custom component key
  span?: 1 | 2 | 3 | 4; // Grid column span
  roles?: UserRole[];
}

// --- Filter Configuration ---

export interface FilterFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'date-range' | 'number-range';
  options?: SelectOptionConfig[] | string;
  defaultValue?: unknown;
  operators?: ('eq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'between')[];
}

// --- Tab & Section Configuration ---

export interface TabConfig {
  id: string;
  label: string;
  icon?: string;
  content: TabContentConfig;
  roles?: UserRole[];
}

export interface TabContentConfig {
  type: 'fields' | 'list' | 'chart' | 'custom';
  fields?: FieldDisplayConfig[];
  listConfig?: Partial<ListPageLayout>;
  chartConfig?: ChartConfig;
  component?: string; // Custom component key
}

export interface FormSectionConfig {
  id: string;
  title: string;
  description?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  fields: FormFieldConfig[];
  columns?: 1 | 2 | 3 | 4;
  condition?: string; // Show condition expression
}

export interface SidebarSectionConfig {
  id: string;
  title: string;
  type: 'info' | 'actions' | 'related' | 'custom';
  fields?: FieldDisplayConfig[];
  actions?: ActionConfig[];
  component?: string;
}

// --- Widget Configuration ---

export interface WidgetConfig {
  id: string;
  type: 'stat' | 'chart' | 'list' | 'table' | 'custom';
  title: string;
  gridPosition: { x: number; y: number; w: number; h: number };
  dataSource?: DataSourceConfig;
  config: StatWidgetConfig | ChartConfig | ListWidgetConfig | TableWidgetConfig | CustomWidgetConfig;
  refreshInterval?: number; // seconds
  roles?: UserRole[];
}

export interface StatWidgetConfig {
  type: 'stat';
  valueField: string;
  label: string;
  icon?: string;
  color?: string;
  format?: FormatConfig;
  linkTo?: string;
  trend?: { field: string; comparison: 'previous_period' };
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'donut' | 'area';
  xAxis?: { field: string; label: string };
  yAxis?: { field: string; label: string };
  series: { field: string; label: string; color?: string }[];
}

export interface ListWidgetConfig {
  type: 'list';
  items: { label: string; value: string }[];
}

export interface TableWidgetConfig {
  type: 'table';
  columns: ColumnConfig[];
}

export interface CustomWidgetConfig {
  type: 'custom';
  component: string;
  props?: Record<string, unknown>;
}

// --- Action Configuration ---

export interface ActionConfig {
  id: string;
  label: string;
  icon?: string;
  type: 'navigate' | 'api' | 'modal' | 'drawer' | 'workflow' | 'custom';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  confirm?: ConfirmConfig;
  handler: ActionHandlerConfig;
  condition?: string; // Expression for conditional display
  roles?: UserRole[];
}

export interface ActionHandlerConfig {
  // For navigate
  to?: string; // Route path with :param placeholders
  // For api
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint?: string;
  payload?: Record<string, unknown>;
  // For modal/drawer
  component?: string;
  props?: Record<string, unknown>;
  // For workflow
  workflowId?: string;
  transition?: string;
  // For custom
  handlerKey?: string;
}

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

// --- Wizard Step Configuration ---

export interface WizardStepConfig {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  fields?: FormFieldConfig[];
  component?: string; // Custom step component
  validation?: ValidationConfig;
  onEnter?: string; // Handler key
  onExit?: string;
  canSkip?: boolean;
  condition?: string; // Show condition
}

// --- Utility Types ---

export interface FormatConfig {
  type: 'date' | 'datetime' | 'number' | 'currency' | 'percent' | 'custom';
  options?: Record<string, unknown>;
  template?: string;
}

export interface SelectOptionConfig {
  value: string | number;
  label: string;
  icon?: string;
  disabled?: boolean;
}

export interface FieldValidationConfig {
  type?: 'string' | 'number' | 'date' | 'email' | 'url' | 'custom';
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  custom?: string; // Validation function key
  message?: string;
}

export interface ValidationConfig {
  schema?: string; // Zod schema key
  rules?: Record<string, FieldValidationConfig>;
}

// --- Workflow State Machine Configuration ---

export interface WorkflowDefinition {
  id: string;
  name: string;
  entity: string;
  statusField: string;
  initialState: string;
  states: WorkflowStateConfig[];
  transitions: WorkflowTransitionConfig[];
  hooks?: WorkflowHookConfig[];
}

export interface WorkflowStateConfig {
  id: string;
  label: string;
  type: 'initial' | 'intermediate' | 'final';
  color?: string;
  icon?: string;
  allowedActions?: string[];
  onEnter?: string; // Hook key
  onExit?: string;
}

export interface WorkflowTransitionConfig {
  id: string;
  from: string | string[];
  to: string;
  label: string;
  trigger: 'manual' | 'automatic' | 'scheduled';
  guard?: string; // Guard function key
  action?: string; // Action to execute
  requiredFields?: string[];
  roles?: UserRole[];
}

export interface WorkflowHookConfig {
  event: 'onTransition' | 'onStateEnter' | 'onStateExit';
  state?: string;
  handler: string;
}
