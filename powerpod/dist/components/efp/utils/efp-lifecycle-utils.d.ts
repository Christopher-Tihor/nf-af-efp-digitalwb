/**
 * EFP Lifecycle Utilities
 * Component lifecycle management and state synchronization utilities
 * Extracted from EFPEntryForm.ts for better maintainability
 */
import { EFPNavigationState, EFPDataState, EFPUIState } from '../types/efp-types.js';
export declare class EFPLifecycleUtils {
    private static logger;
    /**
     * Initialize component state with default values
     */
    static initializeComponentState(): {
        navigation: EFPNavigationState;
        data: EFPDataState;
        ui: Partial<EFPUIState>;
    };
    /**
     * Set up questionnaire store watcher
     */
    static setupQuestionnaireStoreWatcher(onStoreLoaded: () => void, checkInterval?: number, timeout?: number): () => void;
    /**
     * Set up auto-save functionality
     */
    static setupAutoSave(saveFunction: () => Promise<void>, interval?: number): () => void;
    /**
     * Handle component connection lifecycle
     */
    static handleComponentConnected(componentName: string, onQuestionnaireLoaded?: () => void): () => void;
    /**
     * Handle component disconnection lifecycle
     */
    static handleComponentDisconnected(componentName: string): void;
    /**
     * Sync component state from global POWERPOD store
     */
    static syncFromPOWERPOD(): Partial<EFPDataState>;
    /**
     * Update component properties efficiently
     */
    static updateComponentProperties(component: any, updates: Record<string, any>): void;
    /**
     * Debounce function calls to prevent excessive updates
     */
    static debounce<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
    /**
     * Throttle function calls to limit execution frequency
     */
    static throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void;
    /**
     * Create a retry mechanism for async operations
     */
    static createRetryMechanism<T>(operation: () => Promise<T>, maxRetries?: number, delay?: number): () => Promise<T>;
    /**
     * Sleep utility for delays
     */
    static sleep(ms: number): Promise<void>;
    /**
     * Create a timeout wrapper for promises
     */
    static withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage?: string): Promise<T>;
    /**
     * Validate component state
     */
    static validateComponentState(navigation: EFPNavigationState, data: EFPDataState, ui: EFPUIState): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Create a state change observer
     */
    static createStateObserver<T>(getValue: () => T, onChange: (newValue: T, oldValue: T) => void, interval?: number): () => void;
    /**
     * Handle component errors gracefully
     */
    static handleComponentError(error: Error, componentName: string, context?: any): void;
    /**
     * Create a performance monitor for component operations
     */
    static createPerformanceMonitor(operationName: string): {
        end: () => number;
    };
}
