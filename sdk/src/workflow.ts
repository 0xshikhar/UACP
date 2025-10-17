import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowDefinition,
  WorkflowStep,
  ParallelGroup,
  WorkflowRollbackStep,
  WorkflowCondition,
} from './types/orchestration.js';
import { Logger } from './utils/logger.js';

const logger = new Logger({ level: 'info', prefix: 'Workflow' });

/**
 * Step configuration for workflow builder
 */
export interface StepConfig {
  agent: string;
  intent: string;
  task?: Record<string, unknown>;
  dependsOn?: string[];
  timeout?: number;
  retries?: number;
  optional?: boolean;
  condition?: WorkflowCondition;
  onSuccess?: (result: unknown) => void | Promise<void>;
  onError?: (error: Error) => void | Promise<void>;
}

/**
 * AgentWorkflow - Declarative workflow builder
 */
export class AgentWorkflow {
  private id: string;
  private steps: Map<string, WorkflowStep> = new Map();
  private parallelGroups: ParallelGroup[] = [];
  private errorHandlers: Map<string, WorkflowRollbackStep> = new Map();
  private workflowName?: string;
  private workflowDescription?: string;
  private workflowTimeout?: number;
  private currentStepId?: string;

  constructor(name?: string) {
    this.id = uuidv4();
    this.workflowName = name;
    logger.debug(`Workflow created: ${this.id}`, { name });
  }

  /**
   * Add a step to the workflow
   */
  step(stepId: string, config: StepConfig): this {
    if (this.steps.has(stepId)) {
      throw new Error(`Step with id '${stepId}' already exists`);
    }

    const step: WorkflowStep = {
      id: stepId,
      agentId: config.agent,
      intent: config.intent,
      task: config.task,
      dependsOn: config.dependsOn,
      timeout: config.timeout,
      retries: config.retries,
      optional: config.optional,
      onSuccess: config.onSuccess,
      onError: config.onError,
    };

    this.steps.set(stepId, step);
    this.currentStepId = stepId;

    logger.debug(`Step added: ${stepId}`, { agent: config.agent, intent: config.intent });

    return this;
  }

  /**
   * Add multiple steps in parallel
   */
  parallel(
    steps: Array<{ agent: string; intent: string; task?: Record<string, unknown> }>,
    options?: { waitForAll?: boolean; continueOnError?: boolean }
  ): this {
    const parallelSteps: WorkflowStep[] = steps.map((config, index) => ({
      id: `parallel_${this.parallelGroups.length}_step_${index}`,
      agentId: config.agent,
      intent: config.intent,
      task: config.task,
    }));

    const group: ParallelGroup = {
      steps: parallelSteps,
      waitForAll: options?.waitForAll !== false,
      continueOnError: options?.continueOnError || false,
    };

    this.parallelGroups.push(group);
    
    // Add all parallel steps to the steps map
    parallelSteps.forEach((step) => this.steps.set(step.id, step));

    logger.debug(`Parallel group added: ${parallelSteps.length} steps`);

    return this;
  }

  /**
   * Add a conditional step
   */
  stepIf(
    stepId: string,
    condition: WorkflowCondition,
    config: StepConfig
  ): this {
    return this.step(stepId, { ...config, condition });
  }

  /**
   * Chain another step that depends on the current step
   */
  then(stepId: string, config: Omit<StepConfig, 'dependsOn'>): this {
    if (!this.currentStepId) {
      throw new Error('No previous step to chain from. Use step() first.');
    }

    return this.step(stepId, {
      ...config,
      dependsOn: [this.currentStepId],
    });
  }

  /**
   * Add error handler for a specific step
   */
  onError(stepId: string, rollbackConfig: { agent: string; intent: string; task?: Record<string, unknown> }): this {
    const rollbackStep: WorkflowRollbackStep = {
      agentId: rollbackConfig.agent,
      intent: rollbackConfig.intent,
      task: rollbackConfig.task,
    };

    this.errorHandlers.set(stepId, rollbackStep);

    // Also set rollback on the step itself
    const step = this.steps.get(stepId);
    if (step) {
      step.rollback = rollbackStep;
    }

    logger.debug(`Error handler added for step: ${stepId}`);

    return this;
  }

  /**
   * Add global error handler for all steps
   */
  onAnyError(rollbackConfig: { agent: string; intent: string; task?: Record<string, unknown> }): this {
    const rollbackStep: WorkflowRollbackStep = {
      agentId: rollbackConfig.agent,
      intent: rollbackConfig.intent,
      task: rollbackConfig.task,
    };

    this.errorHandlers.set('*', rollbackStep);
    logger.debug('Global error handler added');

    return this;
  }

  /**
   * Set workflow timeout
   */
  timeout(milliseconds: number): this {
    this.workflowTimeout = milliseconds;
    return this;
  }

  /**
   * Set workflow description
   */
  description(desc: string): this {
    this.workflowDescription = desc;
    return this;
  }

  /**
   * Add a retry policy for the current step
   */
  retry(maxRetries: number): this {
    if (!this.currentStepId) {
      throw new Error('No current step to add retry policy to');
    }

    const step = this.steps.get(this.currentStepId);
    if (step) {
      step.retries = maxRetries;
    }

    return this;
  }

  /**
   * Mark current step as optional
   */
  optional(): this {
    if (!this.currentStepId) {
      throw new Error('No current step to mark as optional');
    }

    const step = this.steps.get(this.currentStepId);
    if (step) {
      step.optional = true;
    }

    return this;
  }

  /**
   * Build the workflow definition
   */
  build(): WorkflowDefinition {
    // Validate workflow
    this.validate();

    const definition: WorkflowDefinition = {
      id: this.id,
      name: this.workflowName,
      description: this.workflowDescription,
      steps: Array.from(this.steps.values()),
      parallelGroups: this.parallelGroups.length > 0 ? this.parallelGroups : undefined,
      errorHandlers: this.errorHandlers,
      timeout: this.workflowTimeout,
    };

    logger.info(`Workflow built: ${this.id}`, {
      steps: this.steps.size,
      parallelGroups: this.parallelGroups.length,
    });

    return definition;
  }

  /**
   * Validate workflow definition
   */
  private validate(): void {
    if (this.steps.size === 0) {
      throw new Error('Workflow must have at least one step');
    }

    // Validate dependencies exist
    for (const [stepId, step] of this.steps) {
      if (step.dependsOn) {
        for (const depId of step.dependsOn) {
          if (!this.steps.has(depId)) {
            throw new Error(`Step '${stepId}' depends on non-existent step '${depId}'`);
          }
        }
      }
    }

    // Detect circular dependencies
    this.detectCycles();

    logger.debug('Workflow validation passed');
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCycles(): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (stepId: string): boolean => {
      visited.add(stepId);
      recursionStack.add(stepId);

      const step = this.steps.get(stepId);
      if (step?.dependsOn) {
        for (const depId of step.dependsOn) {
          if (!visited.has(depId)) {
            if (dfs(depId)) return true;
          } else if (recursionStack.has(depId)) {
            throw new Error(`Circular dependency detected involving step '${stepId}'`);
          }
        }
      }

      recursionStack.delete(stepId);
      return false;
    };

    for (const stepId of this.steps.keys()) {
      if (!visited.has(stepId)) {
        dfs(stepId);
      }
    }
  }

  /**
   * Get workflow ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Clone the workflow
   */
  clone(): AgentWorkflow {
    const cloned = new AgentWorkflow(this.workflowName);
    cloned.steps = new Map(this.steps);
    cloned.parallelGroups = [...this.parallelGroups];
    cloned.errorHandlers = new Map(this.errorHandlers);
    cloned.workflowDescription = this.workflowDescription;
    cloned.workflowTimeout = this.workflowTimeout;
    return cloned;
  }
}
