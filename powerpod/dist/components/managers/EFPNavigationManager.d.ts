import { EFPStep, EFPActiveContent, EFPNavigationState } from '../types/EFPTypes';
export declare class EFPNavigationManager {
    private navigationState;
    private flatSteps;
    private activeContent;
    private onStateChange?;
    private onNavigationUpdate?;
    constructor(flatSteps: EFPStep[], onStateChange?: (state: EFPNavigationState, activeContent: EFPActiveContent) => void, onNavigationUpdate?: (stepLabel: string) => void);
    updateFlatSteps(flatSteps: EFPStep[]): void;
    getNavigationState(): EFPNavigationState;
    getActiveContent(): EFPActiveContent;
    goToNext(): void;
    goToPrevious(): void;
    handleSectionChange(newSectionIndex: number): boolean;
    private notifyStateChange;
    private findLastSelectableStepInSection;
    private findFirstSelectableStepInSection;
    private isStepContainer;
}
