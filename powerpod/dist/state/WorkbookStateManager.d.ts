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
export declare class WorkbookStateManager {
    private state;
    private eventListeners;
    constructor();
    /**
     * Get current state (read-only)
     */
    getState(): Readonly<WorkbookState>;
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
     * Sync state from POWERPOD global object
     */
    syncFromPOWERPOD(): void;
    /**
     * Check if workbook is locked (has sign-offs)
     */
    private checkWorkbookLocked;
    /**
     * Load workbook responses
     */
    loadWorkbookResponses(): Promise<void>;
    /**
     * Refresh workbook data from server
     */
    refreshWorkbookData(): Promise<void>;
    /**
     * Clean up state manager
     */
    cleanup(): void;
}
