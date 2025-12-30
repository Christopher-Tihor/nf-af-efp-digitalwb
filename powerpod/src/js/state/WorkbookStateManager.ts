import { Logger } from '../common/logger.js';
import { POWERPOD } from '../common/constants.js';
import WorkbookResponseHelper from '../common/workbookResponseHelper.js';

const logger = Logger('state/WorkbookStateManager');

export interface WorkbookState {
  workbookId: string | null;
  workbookData: any | null;
  workbookResponses: any[];
  isLoadingResponses: boolean;
  questionnaireStoreLoaded: boolean;
  questionsAndResponsesLoaded: boolean;
  workbookLocked: boolean;
  lastUpdated: string | null;
}

/**
 * Centralized state manager for workbook data
 * Provides reactive state updates and abstracts POWERPOD access
 */
export class WorkbookStateManager {
  private state: WorkbookState;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.state = {
      workbookId: null,
      workbookData: null,
      workbookResponses: [],
      isLoadingResponses: false,
      questionnaireStoreLoaded: false,
      questionsAndResponsesLoaded: false,
      workbookLocked: false,
      lastUpdated: null,
    };

    logger.info({ message: 'WorkbookStateManager initialized' });
  }

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<WorkbookState> {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from state changes
   */
  off(event: string, callback: Function): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit state change event
   */
  private emit(event: string, data?: any): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  /**
   * Update state and emit change event
   */
  private updateState(updates: Partial<WorkbookState>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates, lastUpdated: new Date().toISOString() };
    
    this.emit('state-changed', { oldState, newState: this.state, updates });
  }

  /**
   * Sync state from POWERPOD global object
   */
  syncFromPOWERPOD(): void {
    logger.info({ message: 'Syncing state from POWERPOD' });

    const updates: Partial<WorkbookState> = {};

    // Sync workbook data
    if (POWERPOD.workbook?.data) {
      updates.workbookData = POWERPOD.workbook.data;
      updates.workbookId = POWERPOD.workbook.data.quartech_workbookid;
    }

    // Sync responses
    if (POWERPOD.workbookResponses?.data) {
      updates.workbookResponses = POWERPOD.workbookResponses.data;
    }

    // Sync questionnaire store loaded status
    if (POWERPOD.questionnaire?.chapters) {
      updates.questionnaireStoreLoaded = true;
    }

    // Sync questions and responses loaded status
    if (POWERPOD.workbookQuestionsAndResponses?.questionsWithResponses) {
      updates.questionsAndResponsesLoaded = true;
    }

    // Check workbook lock status
    updates.workbookLocked = this.checkWorkbookLocked();

    this.updateState(updates);

    logger.info({ message: 'State synced from POWERPOD', updates });
  }

  /**
   * Check if workbook is locked (has sign-offs)
   */
  private checkWorkbookLocked(): boolean {
    const workbookData = POWERPOD.workbook?.data;
    if (!workbookData) {
      return false;
    }

    // Check for Producer or Planning Advisor sign-off
    const hasProducerSignOff = workbookData.quartech_producersignoffdate != null;
    const hasPlanningAdvisorSignOff = workbookData.quartech_planningadvisorsignoffdate != null;

    return hasProducerSignOff || hasPlanningAdvisorSignOff;
  }

  /**
   * Load workbook responses
   */
  async loadWorkbookResponses(): Promise<void> {
    this.updateState({ isLoadingResponses: true });

    try {
      logger.info({ message: 'Loading workbook responses' });

      await WorkbookResponseHelper.loadWorkbookResponses();

      // Sync state after loading
      this.syncFromPOWERPOD();

      logger.info({ message: 'Workbook responses loaded successfully' });
    } catch (error) {
      logger.error({
        message: `Failed to load workbook responses: ${(error as Error).message}`,
      });
      throw error;
    } finally {
      this.updateState({ isLoadingResponses: false });
    }
  }

  /**
   * Refresh workbook data from server
   */
  async refreshWorkbookData(): Promise<void> {
    // Implementation would fetch fresh data from server
    // For now, just sync from POWERPOD
    this.syncFromPOWERPOD();
  }

  /**
   * Clean up state manager
   */
  cleanup(): void {
    this.eventListeners.clear();
    logger.info({ message: 'WorkbookStateManager cleaned up' });
  }
}

