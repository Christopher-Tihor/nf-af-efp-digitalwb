import { WorkbookResponseService } from './WorkbookResponseService.js';
import { ChapterManagementService } from './ChapterManagementService.js';
import { WorkbookValidationService } from './WorkbookValidationService.js';
import { WorkbookStateManager } from '../state/WorkbookStateManager.js';
import { NavigationStateManager } from '../state/NavigationStateManager.js';
/**
 * Service Container - Dependency Injection Container
 * Manages service lifecycle and dependencies
 */
export declare class ServiceContainer {
    private static instance;
    responseService: WorkbookResponseService;
    chapterService: ChapterManagementService;
    validationService: WorkbookValidationService;
    workbookState: WorkbookStateManager;
    navigationState: NavigationStateManager;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): ServiceContainer;
    /**
     * Reset singleton instance (useful for testing)
     */
    static reset(): void;
    /**
     * Clean up all services
     */
    cleanup(): void;
}
/**
 * Convenience function to get service container instance
 */
export declare function getServices(): ServiceContainer;
