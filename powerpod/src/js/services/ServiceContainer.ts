import { Logger } from '../common/logger.js';
import { WorkbookResponseService } from './WorkbookResponseService.js';
import { ChapterManagementService } from './ChapterManagementService.js';
import { WorkbookValidationService } from './WorkbookValidationService.js';
import { WorkbookStateManager } from '../state/WorkbookStateManager.js';
import { NavigationStateManager } from '../state/NavigationStateManager.js';

const logger = Logger('services/ServiceContainer');

/**
 * Service Container - Dependency Injection Container
 * Manages service lifecycle and dependencies
 */
export class ServiceContainer {
  private static instance: ServiceContainer | null = null;

  // Services
  public responseService: WorkbookResponseService;
  public chapterService: ChapterManagementService;
  public validationService: WorkbookValidationService;

  // State Managers
  public workbookState: WorkbookStateManager;
  public navigationState: NavigationStateManager;

  private constructor() {
    logger.info({ message: 'Initializing ServiceContainer' });

    // Initialize state managers first
    this.workbookState = new WorkbookStateManager();
    this.navigationState = new NavigationStateManager();

    // Initialize services in dependency order
    this.responseService = new WorkbookResponseService();
    this.chapterService = new ChapterManagementService();
    this.validationService = new WorkbookValidationService(this.chapterService);

    logger.info({ message: 'ServiceContainer initialized successfully' });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static reset(): void {
    if (ServiceContainer.instance) {
      ServiceContainer.instance.cleanup();
      ServiceContainer.instance = null;
    }
  }

  /**
   * Clean up all services
   */
  public cleanup(): void {
    logger.info({ message: 'Cleaning up ServiceContainer' });

    // Clean up services
    this.responseService.cleanup();
    this.chapterService.cleanup();
    this.validationService.cleanup();

    // Clean up state managers
    this.workbookState.cleanup();
    this.navigationState.cleanup();

    logger.info({ message: 'ServiceContainer cleaned up' });
  }
}

/**
 * Convenience function to get service container instance
 */
export function getServices(): ServiceContainer {
  return ServiceContainer.getInstance();
}

