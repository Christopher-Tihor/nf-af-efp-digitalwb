// EFP Entry Form utilities - Main export file
// This file provides a convenient way to import all EFP utilities

// Type definitions
export * from './types';

// Utility classes
export { EFPLogger } from './logger';
export { EFPTextUtils } from './text-utils';
export { EFPCompletionUtils } from './completion-utils';
export { EFPSectionGenerator } from './section-generator';
export { EFPNavigationUtils } from './navigation-utils';
export { EFPRenderUtils } from './render-utils';
export { EFPEventUtils } from './event-utils';
export { EFPLifecycleUtils } from './lifecycle-utils';

// Convenience re-exports for commonly used types
export type {
  EFPStep,
  EFPSection,
  EFPSectionItem,
  EFPActiveContent,
  EFPNavigationState,
  EFPSelectableStep,
  EFPChapterData,
  EFPQuestion
} from './types';

// Version information
export const EFP_UTILS_VERSION = '1.0.0';

// Default configuration
export const EFP_DEFAULT_CONFIG = {
  debug: true,
  maxNavigationHistory: 50,
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
};

// Utility function to initialize all utilities with common config
export function initializeEFPUtils(config: Partial<typeof EFP_DEFAULT_CONFIG> = {}) {
  const finalConfig = { ...EFP_DEFAULT_CONFIG, ...config };
  
  // Set debug mode for logger
  EFPLogger.setDebug(finalConfig.debug);
  
  return finalConfig;
}

// Helper function to create a complete EFP step
export function createEFPStep(
  label: string,
  content: string,
  sectionIndex: number,
  options: any = {}
): any {
  return {
    label,
    content,
    sectionIndex,
    complete: false,
    ...options
  };
}

// Helper function to create a complete EFP section
export function createEFPSection(
  tab: string,
  title: string,
  items: any[] = []
): any {
  return {
    tab,
    title,
    items
  };
}

// Helper function to create a complete EFP section item
export function createEFPSectionItem(
  label: string,
  options: any = {}
): any {
  return {
    label,
    complete: false,
    ...options
  };
}
