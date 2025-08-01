import { EFPStep, EFPActiveContent } from './types';
export declare class EFPLifecycleUtils {
    static handleStepIndexChange(currentStepIndex: number, flatSteps: EFPStep[], activeContent: EFPActiveContent, onContentUpdate: (newContent: EFPActiveContent) => void, onNavigationUpdate?: (label: string) => void): boolean;
    static handleSectionIndexChange(currentSectionIndex: number, tabGroupEl: any, onTabUpdate?: () => void): void;
    static shouldRequestUpdate(changedProps: Map<string, unknown>, watchedProps: string[]): boolean;
    static handlePropertyChange<T>(changedProps: Map<string, unknown>, propertyName: string, currentValue: T, onPropertyChange: (newValue: T, oldValue: T) => void): void;
    static createUpdateHandler(watchedProperties: string[], handlers: Record<string, (newValue: any, oldValue: any) => void>): (changedProps: Map<string, unknown>, component: any) => void;
    static debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
    static throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
}
