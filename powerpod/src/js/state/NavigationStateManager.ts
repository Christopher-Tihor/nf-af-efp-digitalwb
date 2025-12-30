import { Logger } from '../common/logger.js';

const logger = Logger('state/NavigationStateManager');

export interface NavigationState {
  currentSectionIndex: number;
  currentStepIndex: number;
  activeContent: any | null;
  isNavigating: boolean;
  navigationHistory: Array<{ sectionIndex: number; stepIndex: number }>;
  breadcrumbs: Array<{ label: string; sectionIndex: number; stepIndex: number }>;
}

/**
 * Centralized state manager for navigation
 * Tracks current position, history, and breadcrumbs
 */
export class NavigationStateManager {
  private state: NavigationState;
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor() {
    this.state = {
      currentSectionIndex: 0,
      currentStepIndex: 0,
      activeContent: null,
      isNavigating: false,
      navigationHistory: [],
      breadcrumbs: [],
    };

    logger.info({ message: 'NavigationStateManager initialized' });
  }

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<NavigationState> {
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
  private updateState(updates: Partial<NavigationState>): void {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    this.emit('state-changed', { oldState, newState: this.state, updates });
  }

  /**
   * Navigate to a specific section and step
   */
  navigateTo(sectionIndex: number, stepIndex: number, activeContent?: any): void {
    logger.info({
      message: `Navigating to section ${sectionIndex}, step ${stepIndex}`,
    });

    // Add to history
    const history = [...this.state.navigationHistory];
    history.push({ sectionIndex, stepIndex });

    // Keep history limited to last 50 entries
    if (history.length > 50) {
      history.shift();
    }

    this.updateState({
      currentSectionIndex: sectionIndex,
      currentStepIndex: stepIndex,
      activeContent: activeContent || null,
      navigationHistory: history,
    });

    this.emit('navigation-changed', {
      sectionIndex,
      stepIndex,
      activeContent,
    });
  }

  /**
   * Set navigation in progress
   */
  setNavigating(isNavigating: boolean): void {
    this.updateState({ isNavigating });
  }

  /**
   * Update breadcrumbs
   */
  updateBreadcrumbs(breadcrumbs: Array<{ label: string; sectionIndex: number; stepIndex: number }>): void {
    this.updateState({ breadcrumbs });
  }

  /**
   * Go to next step
   */
  goToNext(flatSteps: any[]): boolean {
    const nextStepIndex = this.state.currentStepIndex + 1;

    if (nextStepIndex < flatSteps.length) {
      const nextStep = flatSteps[nextStepIndex];
      this.navigateTo(this.state.currentSectionIndex, nextStepIndex, nextStep.content);
      return true;
    }

    return false;
  }

  /**
   * Go to previous step
   */
  goToPrevious(flatSteps: any[]): boolean {
    const prevStepIndex = this.state.currentStepIndex - 1;

    if (prevStepIndex >= 0) {
      const prevStep = flatSteps[prevStepIndex];
      this.navigateTo(this.state.currentSectionIndex, prevStepIndex, prevStep.content);
      return true;
    }

    return false;
  }

  /**
   * Get navigation history
   */
  getHistory(): Array<{ sectionIndex: number; stepIndex: number }> {
    return [...this.state.navigationHistory];
  }

  /**
   * Clear navigation history
   */
  clearHistory(): void {
    this.updateState({ navigationHistory: [] });
  }

  /**
   * Clean up state manager
   */
  cleanup(): void {
    this.eventListeners.clear();
    logger.info({ message: 'NavigationStateManager cleaned up' });
  }
}

