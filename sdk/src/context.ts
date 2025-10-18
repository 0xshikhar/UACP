import { v4 as uuidv4 } from 'uuid';
import { Logger } from './utils/logger.js';

const logger = new Logger({ level: 'info', prefix: 'Context' });

/**
 * Session data stored in context
 */
export interface SessionData {
  id: string;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  metadata: Record<string, unknown>;
  state: Map<string, unknown>;
}

/**
 * Context store configuration
 */
export interface ContextStoreConfig {
  type: 'memory' | 'redis';
  ttl?: number; // Time to live in seconds
  redisUrl?: string;
  maxSessions?: number;
}

/**
 * Context manager for maintaining state across agent interactions
 */
export class ContextManager {
  private sessions: Map<string, SessionData> = new Map();
  private config: ContextStoreConfig;

  constructor(config: Partial<ContextStoreConfig> = {}) {
    this.config = {
      type: config.type || 'memory',
      ttl: config.ttl || 3600, // Default 1 hour
      maxSessions: config.maxSessions || 1000,
      redisUrl: config.redisUrl,
    };

    logger.info('Context manager initialized', { type: this.config.type });

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Create a new session
   */
  async createSession(metadata?: Record<string, unknown>): Promise<string> {
    const sessionId = uuidv4();
    const now = Date.now();

    const session: SessionData = {
      id: sessionId,
      createdAt: now,
      updatedAt: now,
      expiresAt: this.config.ttl ? now + this.config.ttl * 1000 : undefined,
      metadata: metadata || {},
      state: new Map(),
    };

    this.sessions.set(sessionId, session);

    logger.debug(`Session created: ${sessionId}`);

    return sessionId;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check if expired
    if (session.expiresAt && Date.now() > session.expiresAt) {
      await this.deleteSession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Update session state
   */
  async updateSession(
    sessionId: string,
    updates: {
      metadata?: Record<string, unknown>;
      state?: Map<string, unknown> | Record<string, unknown>;
    }
  ): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    if (updates.metadata) {
      session.metadata = { ...session.metadata, ...updates.metadata };
    }

    if (updates.state) {
      if (updates.state instanceof Map) {
        updates.state.forEach((value, key) => {
          session.state.set(key, value);
        });
      } else {
        Object.entries(updates.state).forEach(([key, value]) => {
          session.state.set(key, value);
        });
      }
    }

    session.updatedAt = Date.now();

    this.sessions.set(sessionId, session);

    logger.debug(`Session updated: ${sessionId}`);
  }

  /**
   * Get value from session state
   */
  async get(sessionId: string, key: string): Promise<unknown> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session.state.get(key);
  }

  /**
   * Set value in session state
   */
  async set(sessionId: string, key: string, value: unknown): Promise<void> {
    await this.updateSession(sessionId, {
      state: { [key]: value },
    });
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    logger.debug(`Session deleted: ${sessionId}`);
  }

  /**
   * Extend session expiry
   */
  async extendSession(sessionId: string, ttlSeconds?: number): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const ttl = ttlSeconds || this.config.ttl;
    if (ttl) {
      session.expiresAt = Date.now() + ttl * 1000;
      session.updatedAt = Date.now();
      this.sessions.set(sessionId, session);

      logger.debug(`Session extended: ${sessionId}`, { ttl });
    }
  }

  /**
   * List all active sessions
   */
  async listSessions(): Promise<SessionData[]> {
    return Array.from(this.sessions.values()).filter((session) => {
      // Filter out expired sessions
      if (session.expiresAt && Date.now() > session.expiresAt) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get session count
   */
  async getSessionCount(): Promise<number> {
    const sessions = await this.listSessions();
    return sessions.length;
  }

  /**
   * Clear all sessions
   */
  async clear(): Promise<void> {
    this.sessions.clear();
    logger.info('All sessions cleared');
  }

  /**
   * Start cleanup interval to remove expired sessions
   */
  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [sessionId, session] of this.sessions) {
        if (session.expiresAt && now > session.expiresAt) {
          this.sessions.delete(sessionId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        logger.debug(`Cleaned up ${cleanedCount} expired sessions`);
      }

      // Enforce max sessions limit
      if (this.config.maxSessions && this.sessions.size > this.config.maxSessions) {
        const sortedSessions = Array.from(this.sessions.entries()).sort(
          (a, b) => a[1].updatedAt - b[1].updatedAt
        );

        const toRemove = this.sessions.size - this.config.maxSessions;
        for (let i = 0; i < toRemove; i++) {
          this.sessions.delete(sortedSessions[i][0]);
        }

        logger.debug(`Removed ${toRemove} oldest sessions to enforce limit`);
      }
    }, 60000); // Run every minute
  }
}

/**
 * Conversation context for multi-turn interactions
 */
export class ConversationContext {
  private sessionId: string;
  private contextManager: ContextManager;
  private history: Array<{ role: 'user' | 'agent'; message: string; timestamp: number }> = [];

  constructor(sessionId: string, contextManager: ContextManager) {
    this.sessionId = sessionId;
    this.contextManager = contextManager;
  }

  /**
   * Add message to conversation history
   */
  async addMessage(role: 'user' | 'agent', message: string): Promise<void> {
    this.history.push({
      role,
      message,
      timestamp: Date.now(),
    });

    // Store in session
    await this.contextManager.set(this.sessionId, 'conversation_history', this.history);
  }

  /**
   * Get conversation history
   */
  async getHistory(): Promise<Array<{ role: string; message: string; timestamp: number }>> {
    const stored = await this.contextManager.get(this.sessionId, 'conversation_history');
    if (stored && Array.isArray(stored)) {
      this.history = stored;
    }
    return this.history;
  }

  /**
   * Clear conversation history
   */
  async clearHistory(): Promise<void> {
    this.history = [];
    await this.contextManager.set(this.sessionId, 'conversation_history', []);
  }

  /**
   * Get last N messages
   */
  async getLastMessages(n: number): Promise<Array<{ role: string; message: string; timestamp: number }>> {
    await this.getHistory();
    return this.history.slice(-n);
  }

  /**
   * Set context variable
   */
  async setVariable(key: string, value: unknown): Promise<void> {
    await this.contextManager.set(this.sessionId, key, value);
  }

  /**
   * Get context variable
   */
  async getVariable(key: string): Promise<unknown> {
    return await this.contextManager.get(this.sessionId, key);
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}
