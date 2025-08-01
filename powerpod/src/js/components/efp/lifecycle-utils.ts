import { EFPStep, EFPActiveContent } from './types';

// Utility class for lifecycle management
export class EFPLifecycleUtils {
  static handleStepIndexChange(
    currentStepIndex: number,
    flatSteps: EFPStep[],
    activeContent: EFPActiveContent,
    onContentUpdate: (newContent: EFPActiveContent) => void,
    onNavigationUpdate?: (label: string) => void
  ): boolean {
    const step = flatSteps[currentStepIndex];
    
    if (step && (activeContent.title !== step.label || activeContent.content !== step.content)) {
      const newContent: EFPActiveContent = {
        title: step.label,
        content: step.content,
      };
      
      onContentUpdate(newContent);
      onNavigationUpdate?.(step.label);
      
      return true; // Content was updated
    }
    
    return false; // No update needed
  }

  static handleSectionIndexChange(
    currentSectionIndex: number,
    tabGroupEl: any,
    onTabUpdate?: () => void
  ): void {
    if (tabGroupEl) {
      const activeTab = `section-${currentSectionIndex}`;
      tabGroupEl.show?.(activeTab);
      onTabUpdate?.();
    }
  }

  static shouldRequestUpdate(changedProps: Map<string, unknown>, watchedProps: string[]): boolean {
    return watchedProps.some(prop => changedProps.has(prop));
  }

  static handlePropertyChange<T>(
    changedProps: Map<string, unknown>,
    propertyName: string,
    currentValue: T,
    onPropertyChange: (newValue: T, oldValue: T) => void
  ): void {
    if (changedProps.has(propertyName)) {
      const oldValue = changedProps.get(propertyName) as T;
      onPropertyChange(currentValue, oldValue);
    }
  }

  static createUpdateHandler(
    watchedProperties: string[],
    handlers: Record<string, (newValue: any, oldValue: any) => void>
  ) {
    return (changedProps: Map<string, unknown>, component: any) => {
      watchedProperties.forEach(prop => {
        if (changedProps.has(prop) && handlers[prop]) {
          const oldValue = changedProps.get(prop);
          const newValue = component[prop];
          handlers[prop](newValue, oldValue);
        }
      });
    };
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}
