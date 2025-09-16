export interface EFPStep {
  label: string;
  content: string;
  complete?: boolean;
  sectionIndex: number;
  chapterData?: any;
  subchapterData?: any;
  isContainer?: boolean;
}

export interface EFPActiveContent {
  title: string;
  content: string;
}

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
}

