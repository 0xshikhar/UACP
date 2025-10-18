import EventEmitter from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowStepResult,
  WorkflowStepStatus,
  WorkflowStatus,
  WorkflowContext,
  WorkflowExecutionResult,
  WorkflowExecutionOptions,
  WorkflowEvent,
  ParallelGroup,
} from './types/orchestration.js';
import { AgentRegistry } from './registry.js';
import { MessageRouter } from './router.js';
import { A2AProtocol } from './a2a.js';
import { Logger } from './utils/logger.js';
import { retry } from './utils/retry.js';

const logger = new Logger({ level: 'info', prefix: 'Orchestrator' });

/**
 * AgentOrchestrator - Executes multi-agent workflows
 */
export class AgentOrchestrator {
  private router: MessageRouter;
  private protocol: A2AProtocol;
  private eventEmitter: EventEmitter;

  constructor(
    senderId: string,
    _registry: AgentRegistry,
    router: MessageRouter
  ) {
    this.router = router;
    this.protocol = new A2AProtocol(senderId);
    this.eventEmitter = new EventEmitter();

    logger.info('Orchestrator initialized', { senderId });
  }

  /**
   * Execute a workflow
   */
  async execute(
    workflow: WorkflowDefinition,
    options: WorkflowExecutionOptions = {}
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const workflowId = workflow.id;

    logger.info(`Starting workflow: ${workflowId}`, { name: workflow.name });

    // Initialize context
    const context = this.createContext(workflowId, options);

    // Emit start event
    this.emit(WorkflowEvent.STARTED, { workflowId, context });

    try {
      // Execute workflow steps
      await this.executeWorkflow(workflow, context, options);

      const endTime = Date.now();
      const result: WorkflowExecutionResult = {
        workflowId,
        status: WorkflowStatus.COMPLETED,
        context,
        steps: Array.from(context.results.values()),
        startTime,
        endTime,
        duration: endTime - startTime,
      };

      this.emit(WorkflowEvent.COMPLETED, result);
      logger.info(`Workflow completed: ${workflowId}`, { duration: result.duration });

      return result;
    } catch (error) {
      logger.error(`Workflow failed: ${workflowId}`, error);

      // Attempt rollback
      const rolledBack = await this.rollback(workflow, context);

      const endTime = Date.now();
      const result: WorkflowExecutionResult = {
        workflowId,
        status: rolledBack ? WorkflowStatus.ROLLED_BACK : WorkflowStatus.FAILED,
        context,
        steps: Array.from(context.results.values()),
        startTime,
        endTime,
        duration: endTime - startTime,
        error: error as Error,
      };

      this.emit(WorkflowEvent.FAILED, result);
      throw error;
    }
  }

  /**
   * Execute workflow steps with dependency resolution
   */
  private async executeWorkflow(
    workflow: WorkflowDefinition,
    context: WorkflowContext,
    options: WorkflowExecutionOptions
  ): Promise<void> {
    const executionOrder = this.resolveExecutionOrder(workflow.steps);

    logger.debug(`Execution order resolved: ${executionOrder.map(s => s.id).join(' -> ')}`);

    for (const step of executionOrder) {
      // Check if step is in parallel group
      const parallelGroup = this.findParallelGroup(step, workflow.parallelGroups || []);
      
      if (parallelGroup) {
        // Skip if already processed in parallel group
        if (context.results.has(step.id)) {
          continue;
        }

        // Execute entire parallel group
        await this.executeParallelGroup(parallelGroup, context, options);
      } else {
        // Execute single step
        await this.executeStep(step, context, options);
      }

      // Check for timeout
      if (workflow.timeout && Date.now() - context.startTime > workflow.timeout) {
        throw new Error(`Workflow timeout exceeded: ${workflow.timeout}ms`);
      }
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowContext,
    options: WorkflowExecutionOptions
  ): Promise<WorkflowStepResult> {
    const startTime = Date.now();

    logger.info(`Executing step: ${step.id}`, {
      agent: step.agentId,
      intent: step.intent,
    });

    this.emit(WorkflowEvent.STEP_STARTED, { stepId: step.id, step });

    // Create step result
    const result: WorkflowStepResult = {
      stepId: step.id,
      status: WorkflowStepStatus.RUNNING,
      startTime,
      attempts: 0,
    };

    try {
      // Check dependencies
      if (!this.areDependenciesMet(step, context)) {
        throw new Error(`Dependencies not met for step: ${step.id}`);
      }

      // Build task with context
      const task = this.buildTaskWithContext(step, context);

      // Execute with retry
      const response = await retry(
        async () => {
          result.attempts++;
          
          // Create and send message
          const message = this.protocol.createMessage({
            recipient: step.agentId,
            intent: step.intent,
            task,
            metadata: {
              workflowId: context.workflowId,
              stepId: step.id,
              sessionId: context.sessionId,
            },
          });

          return await this.router.sendMessage(message, {
            timeout: step.timeout,
          });
        },
        { maxRetries: step.retries || 0 },
        `step:${step.id}`
      );

      // Check response
      if (!response.success) {
        throw new Error(response.error?.message || 'Step execution failed');
      }

      // Update result
      result.status = WorkflowStepStatus.COMPLETED;
      result.data = response.data;
      result.endTime = Date.now();
      result.duration = result.endTime - startTime;

      // Store result in context
      context.results.set(step.id, result);

      // Store data in context state
      context.state.set(step.id, response.data);

      // Call success handler
      if (step.onSuccess) {
        await step.onSuccess(response.data);
      }

      // Call user callback
      if (options.onStepComplete) {
        await options.onStepComplete(result);
      }

      this.emit(WorkflowEvent.STEP_COMPLETED, result);
      logger.info(`Step completed: ${step.id}`, { duration: result.duration });

      return result;
    } catch (error) {
      logger.error(`Step failed: ${step.id}`, error);

      result.status = WorkflowStepStatus.FAILED;
      result.error = error as Error;
      result.endTime = Date.now();
      result.duration = result.endTime - startTime;

      context.results.set(step.id, result);

      // Call error handler
      if (step.onError) {
        await step.onError(error as Error);
      }

      // Call user callback
      if (options.onStepError) {
        await options.onStepError(step.id, error as Error);
      }

      this.emit(WorkflowEvent.STEP_FAILED, result);

      // If step is optional, continue
      if (step.optional) {
        logger.warn(`Optional step failed, continuing: ${step.id}`);
        return result;
      }

      // Otherwise, throw error
      throw error;
    }
  }

  /**
   * Execute parallel group of steps
   */
  private async executeParallelGroup(
    group: ParallelGroup,
    context: WorkflowContext,
    options: WorkflowExecutionOptions
  ): Promise<WorkflowStepResult[]> {
    logger.info(`Executing parallel group: ${group.steps.length} steps`);

    this.emit(WorkflowEvent.PARALLEL_GROUP_STARTED, { steps: group.steps });

    const promises = group.steps.map((step) =>
      this.executeStep(step, context, options).catch((error) => {
        if (group.continueOnError) {
          logger.warn(`Parallel step failed (continuing): ${step.id}`, error);
          return {
            stepId: step.id,
            status: WorkflowStepStatus.FAILED,
            error: error as Error,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
            attempts: 1,
          } as WorkflowStepResult;
        }
        throw error;
      })
    );

    let results: WorkflowStepResult[];

    if (group.waitForAll) {
      // Wait for all steps to complete
      results = await Promise.all(promises);
    } else {
      // Wait for first to complete
      const firstResult = await Promise.race(promises);
      results = [firstResult];
    }

    this.emit(WorkflowEvent.PARALLEL_GROUP_COMPLETED, { results });
    logger.info(`Parallel group completed: ${results.length} steps`);

    return results;
  }

  /**
   * Resolve execution order using topological sort
   */
  private resolveExecutionOrder(steps: WorkflowStep[]): WorkflowStep[] {
    const sorted: WorkflowStep[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const stepMap = new Map(steps.map((s) => [s.id, s]));

    const visit = (stepId: string): void => {
      if (visited.has(stepId)) return;
      if (visiting.has(stepId)) {
        throw new Error(`Circular dependency detected: ${stepId}`);
      }

      visiting.add(stepId);

      const step = stepMap.get(stepId);
      if (!step) return;

      // Visit dependencies first
      if (step.dependsOn) {
        for (const depId of step.dependsOn) {
          visit(depId);
        }
      }

      visiting.delete(stepId);
      visited.add(stepId);
      sorted.push(step);
    };

    // Visit all steps
    for (const step of steps) {
      visit(step.id);
    }

    return sorted;
  }

  /**
   * Check if step dependencies are met
   */
  private areDependenciesMet(step: WorkflowStep, context: WorkflowContext): boolean {
    if (!step.dependsOn || step.dependsOn.length === 0) {
      return true;
    }

    return step.dependsOn.every((depId) => {
      const depResult = context.results.get(depId);
      return depResult && depResult.status === WorkflowStepStatus.COMPLETED;
    });
  }

  /**
   * Build task with context data
   */
  private buildTaskWithContext(
    step: WorkflowStep,
    context: WorkflowContext
  ): Record<string, unknown> {
    const task = { ...(step.task || {}) };

    // Add context data from dependencies
    if (step.dependsOn) {
      for (const depId of step.dependsOn) {
        const depData = context.state.get(depId);
        if (depData) {
          task[`${depId}_result`] = depData;
        }
      }
    }

    // Add session context
    task._context = {
      workflowId: context.workflowId,
      sessionId: context.sessionId,
      stepId: step.id,
    };

    return task;
  }

  /**
   * Find if step belongs to a parallel group
   */
  private findParallelGroup(
    step: WorkflowStep,
    parallelGroups: ParallelGroup[]
  ): ParallelGroup | undefined {
    return parallelGroups.find((group) =>
      group.steps.some((s) => s.id === step.id)
    );
  }

  /**
   * Rollback workflow on failure
   */
  private async rollback(
    workflow: WorkflowDefinition,
    context: WorkflowContext
  ): Promise<boolean> {
    logger.info(`Rolling back workflow: ${workflow.id}`);

    const completedSteps = Array.from(context.results.values())
      .filter((r) => r.status === WorkflowStepStatus.COMPLETED)
      .reverse(); // Rollback in reverse order

    let rolledBackCount = 0;

    for (const stepResult of completedSteps) {
      const step = workflow.steps.find((s) => s.id === stepResult.stepId);
      if (!step) continue;

      // Get rollback handler
      let rollbackStep = step.rollback;
      if (!rollbackStep) {
        // Try global handler
        rollbackStep = workflow.errorHandlers?.get('*');
      }
      if (!rollbackStep) {
        // Try step-specific handler
        rollbackStep = workflow.errorHandlers?.get(step.id);
      }

      if (rollbackStep) {
        try {
          logger.info(`Rolling back step: ${step.id}`);

          const message = this.protocol.createMessage({
            recipient: rollbackStep.agentId,
            intent: rollbackStep.intent,
            task: {
              ...(rollbackStep.task || {}),
              originalStepId: step.id,
              originalResult: stepResult.data,
            },
          });

          await this.router.sendMessage(message);
          rolledBackCount++;
        } catch (error) {
          logger.error(`Rollback failed for step: ${step.id}`, error);
        }
      }
    }

    this.emit(WorkflowEvent.ROLLED_BACK, {
      workflowId: workflow.id,
      rolledBackCount,
    });

    return rolledBackCount > 0;
  }

  /**
   * Create workflow context
   */
  private createContext(
    workflowId: string,
    options: WorkflowExecutionOptions
  ): WorkflowContext {
    const context: WorkflowContext = {
      workflowId,
      sessionId: options.sessionId || uuidv4(),
      startTime: Date.now(),
      state: new Map(Object.entries(options.initialState || {})),
      results: new Map(),
      metadata: options.metadata,
    };

    return context;
  }

  /**
   * Get workflow context
   */
  getContext(_workflowId: string): WorkflowContext | undefined {
    // In future, this could retrieve from a context store
    return undefined;
  }

  /**
   * Event emitter methods
   */
  on(event: WorkflowEvent | string, handler: (...args: any[]) => void): void {
    this.eventEmitter.on(event, handler);
  }

  once(event: WorkflowEvent | string, handler: (...args: any[]) => void): void {
    this.eventEmitter.once(event, handler);
  }

  off(event: WorkflowEvent | string, handler: (...args: any[]) => void): void {
    this.eventEmitter.off(event, handler);
  }

  emit(event: WorkflowEvent | string, data?: any): void {
    this.eventEmitter.emit(event, data);
  }
}
