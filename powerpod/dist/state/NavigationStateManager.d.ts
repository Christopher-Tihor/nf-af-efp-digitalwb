export interface NavigationState {
    currentSectionIndex: number;
    currentStepIndex: number;
    activeContent: any | null;
    isNavigating: boolean;
    navigationHistory: Array<{
        sectionIndex: number;
        stepIndex: number;
    }>;
    breadcrumbs: Array<{
        label: string;
        sectionIndex: number;
        stepIndex: number;
    }>;
}
/**
 * Centralized state manager for navigation
 * Tracks current position, history, and breadcrumbs
 */
export declare class NavigationStateManager {
    private state;
    private eventListeners;
    constructor();
    /**
     * Get current state (read-only)
     */
    getState(): Readonly<NavigationState>;
    /**
     * Subscribe to state changes
     */
    on(event: string, callback: Function): void;
    /**
     * Unsubscribe from state changes
     */
    off(event: string, callback: Function): void;
    /**
     * Emit state change event
     */
    private emit;
    /**
     * Update state and emit change event
     */
    private updateState;
    /**
     * Navigate to a specific section and step
     */
    navigateTo(sectionIndex: number, stepIndex: number, activeContent?: any): void;
    /**
     * Set navigation in progress
     */
    setNavigating(isNavigating: boolean): void;
    /**
     * Update breadcrumbs
     */
    updateBreadcrumbs(breadcrumbs: Array<{
        label: string;
        sectionIndex: number;
        stepIndex: number;
    }>): void;
    /**
     * Go to next step
     */
    goToNext(flatSteps: any[]): boolean;
    /**
     * Go to previous step
     */
    goToPrevious(flatSteps: any[]): boolean;
    /**
     * Get navigation history
     */
    getHistory(): Array<{
        sectionIndex: number;
        stepIndex: number;
    }>;
    /**
     * Clear navigation history
     */
    clearHistory(): void;
    /**
     * Clean up state manager
     */
    cleanup(): void;
}
