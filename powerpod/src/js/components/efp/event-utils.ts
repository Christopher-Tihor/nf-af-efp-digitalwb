import { Logger } from '../../common/logger.js';

import { EFPStep, EFPSectionItem } from './types.js';

// Create logger instance for EFP event utilities
const logger = Logger('components/efp/event-utils');

// Utility class for event handling helpers
export class EFPEventUtils {
  static handleItemClick(
    item: EFPSectionItem,
    flatSteps: EFPStep[],
    onStepChange: (stepIndex: number, sectionIndex: number) => void,
    onNavigationUpdate: (label: string) => void
  ): void {
    const index = flatSteps.findIndex((i) => i.label === item.label);
    logger.info({ message: `Navigation click: Looking for "${item.label}", found at index: ${index}` });

    if (index !== -1) {
      const sectionIndex = flatSteps[index].sectionIndex;
      logger.info({ message: `Set currentStepIndex to ${index}, currentSectionIndex to ${sectionIndex}` });

      onStepChange(index, sectionIndex);
      onNavigationUpdate(item.label);
    } else {
      logger.warn({ message: `Step "${item.label}" not found in flatSteps. Available steps: ${flatSteps.map(s => s.label).join(', ')}` });
    }
  }

  static handleSectionChange(
    newSectionIndex: number,
    isNavigating: boolean,
    flatSteps: EFPStep[],
    onStepChange: (stepIndex: number, sectionIndex: number) => void,
    onNavigationUpdate: (label: string) => void
  ): void {
    logger.info({ message: `Section changed to: ${newSectionIndex}, isNavigating: ${isNavigating}` });

    // If we're in the middle of programmatic navigation, don't interfere
    if (isNavigating) {
      logger.info({ message: 'Ignoring section change during navigation' });
      return;
    }

    // Find the first CONTENT step in the new section (skip section headers)
    const stepsInSection = flatSteps.filter(step => step.sectionIndex === newSectionIndex);
    logger.info({ message: `Found ${stepsInSection.length} steps in section ${newSectionIndex}`, data: { steps: stepsInSection.map(s => s.label) } });

    // Skip the first step if it's just the section header (tab name)
    // The first step is typically the tab name itself (e.g., "My Workbook", "Review & Submit")
    // We want to skip that and go to the actual content
    let firstContentStep = stepsInSection.find(step =>
      !step.label.startsWith('Section ') &&
      step.content &&
      step.content.trim() !== '' &&
      step.content !== step.label &&
      // Also skip if the label matches common tab names
      step.label !== 'My Workbook' &&
      step.label !== 'Review & Submit'
    );

    // If no content step found, fall back to the first step after the section header
    if (!firstContentStep && stepsInSection.length > 1) {
      logger.info({ message: 'No content step found, using second step (after header)' });
      firstContentStep = stepsInSection[1];
    }

    // If still no step found, use the first step in the section
    if (!firstContentStep && stepsInSection.length > 0) {
      logger.info({ message: 'Using first step in section as fallback' });
      firstContentStep = stepsInSection[0];
    }

    if (firstContentStep) {
      const stepIndex = flatSteps.indexOf(firstContentStep);
      logger.info({ message: `Navigating to first content step: "${firstContentStep.label}" at index ${stepIndex}` });
      onStepChange(stepIndex, newSectionIndex);
      onNavigationUpdate(firstContentStep.label);
    } else {
      logger.warn({ message: `No steps found for section: ${newSectionIndex}` });
    }
  }

  static handleRatingChanged(
    event: CustomEvent,
    onAnswerUpdate?: (questionId: string, value: any) => void
  ): void {
    const { questionId, value } = event.detail;
    logger.info({ message: `Question ${questionId} answered with: ${value}` });
    
    // Call the optional callback to update answers
    onAnswerUpdate?.(questionId, value);
    
    // Dispatch a custom event for parent components
    const answerEvent = new CustomEvent('efp-answer-changed', {
      detail: { questionId, value },
      bubbles: true,
      composed: true
    });
    
    event.target?.dispatchEvent(answerEvent);
  }

  static handleNavigationPrevious(goToPrevious: () => void): void {
    goToPrevious();
  }

  static handleNavigationSkip(event: CustomEvent, onSectionChange: (sectionIndex: number) => void): void {
    onSectionChange(event.detail.sectionIndex);
  }

  static handleNavigationContinue(goToNext: () => void): void {
    goToNext();
  }

  static createTabShowHandler(onSectionChange: (newSectionIndex: number) => void) {
    return (e: CustomEvent) => {
      const tabIndex = parseInt(e.detail.name.replace('section-', ''));
      onSectionChange(tabIndex);
    };
  }

  static createItemClickHandler(
    flatSteps: EFPStep[],
    onStepChange: (stepIndex: number, sectionIndex: number) => void,
    onNavigationUpdate: (label: string) => void
  ) {
    return (item: EFPSectionItem) => {
      EFPEventUtils.handleItemClick(item, flatSteps, onStepChange, onNavigationUpdate);
    };
  }
}
