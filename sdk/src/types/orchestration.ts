/**
 * Orchestration types for multi-agent workflow coordination
 */

export enum WorkflowStepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back',
}

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  id: string;
  agentId: string;
  intent: string;
  task?: Record<string, unknown>;
  dependsOn?: string[];
  timeout?: number;
  retries?: number;
  optional?: boolean;
  rollback?: WorkflowRollbackStep;
  onSuccess?: (result: unknown) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

/**
 * Rollback step definition
 */
export interface WorkflowRollbackStep {
  agentId: string;
  intent: string;
  task?: Record<string, unknown>;
}

/**
 * Parallel execution group
 */
export interface ParallelGroup {
  steps: WorkflowStep[];
  waitForAll?: boolean; // If false, continues when first completes
  continueOnError?: boolean;
}

/**
 * Workflow step result
 */
export interface WorkflowStepResult {
  stepId: string;
  status: WorkflowStepStatus;
  data?: unknown;
  error?: Error;
  startTime: number;
  endTime?: number;
  duration?: number;
  attempts: number;
}

/**
 * Workflow context - carries state through execution
 */
export interface WorkflowContext {
  workflowId: string;
  sessionId?: string;
  startTime: number;
  state: Map<string, unknown>;
  results: Map<string, WorkflowStepResult>;
  metadata?: Record<string, unknown>;
}

/**
 * Workflow execution options
 */
export interface WorkflowExecutionOptions {
  sessionId?: string;
  initialState?: Record<string, unknown>;
  timeout?: number;
  metadata?: Record<string, unknown>;
  onStepComplete?: (result: WorkflowStepResult) => void | Promise<void>;
  onStepError?: (stepId: string, error: Error) => void | Promise<void>;
  continueOnError?: boolean;
}

/**
 * Workflow definition
 */
export interface WorkflowDefinition {
  id: string;
  name?: string;
  description?: string;
  steps: WorkflowStep[];
  parallelGroups?: ParallelGroup[];
  errorHandlers?: Map<string, WorkflowRollbackStep>;
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoff?: 'linear' | 'exponential';
  };
}

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  workflowId: string;
  status: WorkflowStatus;
  context: WorkflowContext;
  steps: WorkflowStepResult[];
  startTime: number;
  endTime: number;
  duration: number;
  error?: Error;
}

/**
 * Workflow events
 */
export enum WorkflowEvent {
  STARTED = 'workflow:started',
  STEP_STARTED = 'workflow:step:started',
  STEP_COMPLETED = 'workflow:step:completed',
  STEP_FAILED = 'workflow:step:failed',
  PARALLEL_GROUP_STARTED = 'workflow:parallel:started',
  PARALLEL_GROUP_COMPLETED = 'workflow:parallel:completed',
  COMPLETED = 'workflow:completed',
  FAILED = 'workflow:failed',
  ROLLED_BACK = 'workflow:rolled_back',
}

/**
 * Conditional execution
 */
export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: unknown;
}
