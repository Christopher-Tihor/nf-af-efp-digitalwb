import { Logger } from '../../common/logger.js';
import { POWERPOD } from '../../common/constants.js';
import { getQuestionnaireFromStore } from '../../common/questionnaire.js';

import { EFPStep, EFPSection, EFPSectionItem } from './types.js';

const logger = Logger('components/efp/navigation-utils');

// Navigation context for passing component state to utility methods
export interface NavigationContext {
  currentStepIndex: number;
  flatSteps: EFPStep[];
  sections: EFPSection[];
  activeContentTitle: string;
  canAccessReviewAndSubmit: boolean;
  getQuestionsForChapter: (chapterId: string) => any[];
}

// Result of navigation operation
export interface NavigationResult {
  success: boolean;
  newStepIndex?: number;
  newSectionIndex?: number;
  newActiveContent?: { title: string; content: string };
  scrollToTop?: boolean;
  scrollToQuestion?: { questionId: string };
  showIncompleteAlert?: boolean;
  errorMessage?: string;
}

export class EFPNavigationUtils {
  static isStepContainer(step: EFPStep, sections: EFPSection[]): boolean {
    if (!step.content || step.content === '') {
      return true;
    }

    for (const section of sections) {
      for (const item of section.items) {
        if ('items' in item && Array.isArray(item.items)) {
          for (const subItem of item.items) {
            if (subItem.label === step.label && subItem.isContainer) {
              return true;
            }
          }
        }
      }
    }

    if (/^Chapter \d+$/.test(step.label)) {
      return true;
    }

    if (/^Chapter \d+: /.test(step.label)) {
      const flatSteps = EFPNavigationUtils.getFlatStepsFromSections(sections);
      const currentIndex = flatSteps.findIndex(s => s.label === step.label);
      if (currentIndex >= 0 && currentIndex < flatSteps.length - 1) {
        const nextStep = flatSteps[currentIndex + 1];
        if (
          nextStep &&
          nextStep.label.length > step.label.length &&
          !nextStep.label.startsWith('Chapter ') &&
          nextStep.content &&
          nextStep.content.trim() !== ''
        ) {
          return true;
        }
      }
    }

    if (step.content && step.content.includes('Please select a specific chapter section')) {
      return true;
    }

    return false;
  }

  static findLastSelectableStepInSection(
    sectionIndex: number,
    flatSteps: EFPStep[],
    sections: EFPSection[]
  ): { step: EFPStep; index: number } | null {
    const stepsInSection: { step: EFPStep; index: number }[] = [];

    flatSteps.forEach((step, index) => {
      if (step.sectionIndex === sectionIndex) {
        stepsInSection.push({ step, index });
      }
    });

    // Get the section tab name to skip section header steps
    const sectionTabName = sections[sectionIndex]?.tab;

    for (let i = stepsInSection.length - 1; i >= 0; i--) {
      const { step, index } = stepsInSection[i];
      const isContainer = EFPNavigationUtils.isStepContainer(step, sections);

      // Skip containers, section header steps (where label matches section tab), and steps starting with 'Section '
      const isSectionHeader = step.label === sectionTabName;
      if (!isContainer && !isSectionHeader && !step.label.startsWith('Section ')) {
        logger.info({ message: `Found last selectable step in section ${sectionIndex}: "${step.label}" at index ${index}` });
        return { step, index };
      }
    }

    logger.warn({ message: `No selectable steps found in section ${sectionIndex}` });
    return null;
  }

  static findFirstSelectableStepInSection(
    sectionIndex: number,
    flatSteps: EFPStep[],
    sections: EFPSection[]
  ): { step: EFPStep; index: number } | null {
    const stepsInSection: { step: EFPStep; index: number }[] = [];

    flatSteps.forEach((step, index) => {
      if (step.sectionIndex === sectionIndex) {
        stepsInSection.push({ step, index });
      }
    });

    // Get the section tab name to skip section header steps
    const sectionTabName = sections[sectionIndex]?.tab;

    for (let i = 0; i < stepsInSection.length; i++) {
      const { step, index } = stepsInSection[i];
      const isContainer = EFPNavigationUtils.isStepContainer(step, sections);

      // Skip containers, section header steps (where label matches section tab), and steps starting with 'Section '
      const isSectionHeader = step.label === sectionTabName;
      if (!isContainer && !isSectionHeader && !step.label.startsWith('Section ')) {
        logger.info({ message: `Found first selectable step in section ${sectionIndex}: "${step.label}" at index ${index}` });
        return { step, index };
      }
    }

    logger.warn({ message: `No selectable steps found in section ${sectionIndex}` });
    return null;
  }

  static findContainersForItem(itemLabel: string, sections: EFPSection[]): string[] {
    const containers: string[] = [];

    const searchItems = (items: EFPSectionItem[], parentContainers: string[] = []) => {
      for (const item of items) {
        const currentPath = [...parentContainers];

        if ('items' in item && Array.isArray(item.items)) {
          if (item.title) {
            currentPath.push(item.title);
          }

          const foundInChildren = EFPNavigationUtils.itemExistsInChildren(item.items, itemLabel);
          if (foundInChildren) {
            containers.push(...currentPath);
          }

          searchItems(item.items, currentPath);
        }
      }
    };

    sections.forEach(section => {
      if (section.items) {
        searchItems(section.items);
      }
    });

    return containers;
  }

  static itemExistsInChildren(items: EFPSectionItem[], targetLabel: string): boolean {
    for (const item of items) {
      if (item.label === targetLabel) {
        return true;
      }
      if ('items' in item && Array.isArray(item.items)) {
        if (EFPNavigationUtils.itemExistsInChildren(item.items, targetLabel)) {
          return true;
        }
      }
    }
    return false;
  }

  static getFlatStepsFromSections(sections: EFPSection[]): EFPStep[] {
    const result: EFPStep[] = [];

    const collect = (items: EFPSectionItem[], sectionIndex: number) => {
      for (const item of items) {
        if ('items' in item && Array.isArray(item.items)) {
          const containerStep: EFPStep = {
            label: item.title || item.label,
            content: item.content ?? '',
            sectionIndex,
            isContainer: true,
          };

          if (item.chapterId) {
            containerStep.chapterId = item.chapterId;
          }

          if (item.chapterData) {
            containerStep.chapterData = item.chapterData;
          }

          if (item.subchapterData) {
            containerStep.subchapterData = item.subchapterData;
          }

          if (item.hideSkipChapterCheckbox) {
            containerStep.hideSkipChapterCheckbox = item.hideSkipChapterCheckbox;
          }

          result.push(containerStep);
          collect(item.items, sectionIndex);
        } else {
          const stepItem: EFPStep = {
            label: item.label,
            content: item.content ?? '',
            complete: item.complete ?? false,
            sectionIndex,
          };

          if (item.chapterId) {
            stepItem.chapterId = item.chapterId;
          }

          if (item.chapterData) {
            stepItem.chapterData = item.chapterData;
          }

          if (item.subchapterData) {
            stepItem.subchapterData = item.subchapterData;
          }

          if (item.isContainer) {
            stepItem.isContainer = item.isContainer;
          }

          if (item.hideSkipChapterCheckbox) {
            stepItem.hideSkipChapterCheckbox = item.hideSkipChapterCheckbox;
          }

          if (item.renderSignOffButtons) {
            stepItem.renderSignOffButtons = item.renderSignOffButtons;
          }

          result.push(stepItem);
        }
      }
    };

    sections.forEach((section, index) => {
      result.push({
        label: section.tab,
        content: section.title,
        sectionIndex: index,
      });
      collect(section.items, index);
    });

    return result;
  }
  static findNextSelectableStep(
    currentIndex: number,
    flatSteps: EFPStep[],
    sections: EFPSection[]
  ): number | null {
    // Build a set of section tab names to skip section header steps
    const sectionTabNames = new Set(sections.map(s => s.tab));

    for (let i = currentIndex + 1; i < flatSteps.length; i++) {
      const step = flatSteps[i];
      const isSectionHeader = sectionTabNames.has(step.label);
      if (!EFPNavigationUtils.isStepContainer(step, sections) && !isSectionHeader && !step.label.startsWith('Section ')) {
        logger.info({ message: `Next selectable step: "${step.label}" at index ${i}` });
        return i;
      }
    }
    logger.warn({ message: `No next selectable step after index ${currentIndex}` });
    return null;
  }

  static findPreviousSelectableStep(
    currentIndex: number,
    flatSteps: EFPStep[],
    sections: EFPSection[]
  ): number | null {
    // Build a set of section tab names to skip section header steps
    const sectionTabNames = new Set(sections.map(s => s.tab));

    for (let i = currentIndex - 1; i >= 0; i--) {
      const step = flatSteps[i];
      const isSectionHeader = sectionTabNames.has(step.label);
      if (!EFPNavigationUtils.isStepContainer(step, sections) && !isSectionHeader && !step.label.startsWith('Section ')) {
        logger.info({ message: `Previous selectable step: "${step.label}" at index ${i}` });
        return i;
      }
    }
    logger.warn({ message: `No previous selectable step before index ${currentIndex}` });
    return null;
  }

  static navigateToStep(
    targetIndex: number,
    flatSteps: EFPStep[],
    sections: EFPSection[]
  ): { stepIndex: number; sectionIndex: number } | null {
    if (targetIndex < 0 || targetIndex >= flatSteps.length) {
      logger.warn({ message: `navigateToStep: targetIndex ${targetIndex} out of range` });
      return null;
    }

    let index = targetIndex;

    if (EFPNavigationUtils.isStepContainer(flatSteps[index], sections)) {
      const tryNext = EFPNavigationUtils.findNextSelectableStep(index, flatSteps, sections);
      const tryPrev = EFPNavigationUtils.findPreviousSelectableStep(index, flatSteps, sections);
      index = (tryNext ?? tryPrev) ?? -1;

      if (index === -1) {
        logger.warn({ message: `navigateToStep: no selectable step near container at index ${targetIndex}` });
        return null;
      }
    }

    return { stepIndex: index, sectionIndex: flatSteps[index].sectionIndex };
  }

  static navigateToSection(
    targetSectionIndex: number,
    flatSteps: EFPStep[],
    sections: EFPSection[]
  ): { stepIndex: number; sectionIndex: number } | null {
    const first = EFPNavigationUtils.findFirstSelectableStepInSection(
      targetSectionIndex,
      flatSteps,
      sections
    );

    if (!first) {
      logger.warn({ message: `navigateToSection: no selectable step found in section ${targetSectionIndex}` });
      return null;
    }

    return { stepIndex: first.index, sectionIndex: first.step.sectionIndex };
  }

  // ============================================
  // Navigation Operations (use NavigationContext)
  // ============================================

  /**
   * Resolves the current step index when it's -1 by matching active content title
   */
  static resolveCurrentStepIndex(ctx: NavigationContext): number {
    if (ctx.currentStepIndex !== -1) {
      return ctx.currentStepIndex;
    }

    logger.warn({
      message: 'currentStepIndex is -1, trying to find current step by activeContent title',
    });

    const foundIndex = ctx.flatSteps.findIndex(
      (step) => step.label === ctx.activeContentTitle
    );

    if (foundIndex !== -1) {
      logger.info({
        message: `Found current step "${ctx.activeContentTitle}" at index ${foundIndex}`,
      });
      return foundIndex;
    }

    logger.error({
      message: `Could not find current step "${ctx.activeContentTitle}" in flatSteps`,
    });
    return -1;
  }

  /**
   * Calculate the next navigation result (for goToNext)
   */
  static calculateNextNavigation(ctx: NavigationContext): NavigationResult {
    const resolvedIndex = EFPNavigationUtils.resolveCurrentStepIndex(ctx);
    if (resolvedIndex === -1) {
      return { success: false, errorMessage: 'Could not resolve current step' };
    }

    const currentStep = ctx.flatSteps[resolvedIndex];
    let nextIndex = EFPNavigationUtils.findNextSelectableStep(
      resolvedIndex,
      ctx.flatSteps,
      ctx.sections
    );

    if (nextIndex == null) {
      return { success: false, errorMessage: 'No next step available' };
    }

    let nextStep = ctx.flatSteps[nextIndex];

    // When crossing section boundaries, navigate to the first content step in the new section
    if (currentStep && nextStep.sectionIndex !== currentStep.sectionIndex) {
      const firstContentStep = EFPNavigationUtils.findFirstSelectableStepInSection(
        nextStep.sectionIndex,
        ctx.flatSteps,
        ctx.sections
      );
      if (firstContentStep) {
        logger.info({
          message: `Crossing to section ${nextStep.sectionIndex}, navigating to first content step "${firstContentStep.step.label}"`,
        });
        nextIndex = firstContentStep.index;
        nextStep = firstContentStep.step;
      }
    }

    // Block navigation to "Review & Submit" section if there are incomplete questions
    if (nextStep.sectionIndex === 1 && !ctx.canAccessReviewAndSubmit) {
      return { success: false, showIncompleteAlert: true };
    }

    // Check if next step has the same label and content as current step (duplicate)
    const isSameContent = currentStep &&
      currentStep.label === nextStep.label &&
      currentStep.content === nextStep.content;

    if (isSameContent) {
      logger.info({
        message: `Skipping duplicate step "${nextStep.label}" at index ${nextIndex}, continuing to next`,
      });

      // Skip this duplicate and go to the next step
      const nextNextIndex = EFPNavigationUtils.findNextSelectableStep(
        nextIndex,
        ctx.flatSteps,
        ctx.sections
      );

      if (nextNextIndex != null) {
        const nextNextStep = ctx.flatSteps[nextNextIndex];

        // Block navigation to "Review & Submit" section if there are incomplete questions
        if (nextNextStep.sectionIndex === 1 && !ctx.canAccessReviewAndSubmit) {
          return { success: false, showIncompleteAlert: true };
        }

        return {
          success: true,
          newStepIndex: nextNextIndex,
          newSectionIndex: nextNextStep.sectionIndex,
          newActiveContent: { title: nextNextStep.label, content: nextNextStep.content },
          scrollToTop: true,
        };
      }
      return { success: false, errorMessage: 'No step after duplicate' };
    }

    return {
      success: true,
      newStepIndex: nextIndex,
      newSectionIndex: nextStep.sectionIndex,
      newActiveContent: { title: nextStep.label, content: nextStep.content },
      scrollToTop: true,
    };
  }

  /**
   * Calculate the previous navigation result (for goToPrevious)
   */
  static calculatePreviousNavigation(ctx: NavigationContext): NavigationResult {
    const resolvedIndex = EFPNavigationUtils.resolveCurrentStepIndex(ctx);
    if (resolvedIndex === -1) {
      return { success: false, errorMessage: 'Could not resolve current step' };
    }

    const prevIndex = EFPNavigationUtils.findPreviousSelectableStep(
      resolvedIndex,
      ctx.flatSteps,
      ctx.sections
    );

    if (prevIndex == null) {
      return { success: false, errorMessage: 'No previous step available' };
    }

    const prevStep = ctx.flatSteps[prevIndex];
    const currentStep = ctx.flatSteps[resolvedIndex];

    // Check if previous step has the same label and content as current step (duplicate)
    const isSameContent = currentStep &&
      currentStep.label === prevStep.label &&
      currentStep.content === prevStep.content;

    if (isSameContent) {
      logger.info({
        message: `Skipping duplicate step "${prevStep.label}" at index ${prevIndex}, continuing to previous`,
      });

      const prevPrevIndex = EFPNavigationUtils.findPreviousSelectableStep(
        prevIndex,
        ctx.flatSteps,
        ctx.sections
      );

      if (prevPrevIndex != null) {
        const prevPrevStep = ctx.flatSteps[prevPrevIndex];
        return {
          success: true,
          newStepIndex: prevPrevIndex,
          newSectionIndex: prevPrevStep.sectionIndex,
          newActiveContent: { title: prevPrevStep.label, content: prevPrevStep.content },
          scrollToTop: true,
        };
      }
      return { success: false, errorMessage: 'No step before duplicate' };
    }

    return {
      success: true,
      newStepIndex: prevIndex,
      newSectionIndex: prevStep.sectionIndex,
      newActiveContent: { title: prevStep.label, content: prevStep.content },
      scrollToTop: true,
    };
  }

  /**
   * Find the next required step (earliest unanswered, non-skipped question)
   */
  static findNextRequiredStep(ctx: NavigationContext): { stepIndex: number; questionId: string } | null {
    if (!POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      logger.warn({
        message: 'Cannot find next required step: workbook questions and responses not loaded',
      });
      return null;
    }

    const questionnaire: any = getQuestionnaireFromStore();
    if (!questionnaire?.chapters?.length) {
      logger.warn({
        message: 'Cannot find next required step: questionnaire not loaded',
      });
      return null;
    }

    // Iterate through all steps in the My Workbook section (section index 0)
    for (let i = 0; i < ctx.flatSteps.length; i++) {
      const step = ctx.flatSteps[i];

      // Only check steps in My Workbook section
      if (step.sectionIndex !== 0) {
        continue;
      }

      // Skip section headers
      if (step.label.startsWith('Section ')) {
        continue;
      }

      // For container steps, only skip if they don't have their own questions
      if (step.isContainer) {
        const hasOwnQuestions = step.chapterData?.questions?.length > 0;
        if (!hasOwnQuestions) {
          continue;
        }
      }

      // Get the chapter/subchapter data for this step
      const chapterData = step.subchapterData || step.chapterData;

      if (!chapterData) {
        continue;
      }

      // IMPORTANT: Only check the step's OWN questions, not subchapter questions
      // This ensures we navigate to the actual step containing the question,
      // not a parent container step
      const ownQuestions = chapterData.questions || [];

      // Find the first unanswered, non-skipped question in this step's own questions
      const firstUnansweredQuestion = ownQuestions.find((question: any) => {
        const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(question.id);
        const isSkipped = entry?.response?.quartech_chapterskipped === 100000000;
        const hasResponse = entry?.response?.quartech_response &&
                           entry.response.quartech_response.trim() !== '';

        // Question is required and unanswered if it's not skipped AND has no response
        return !isSkipped && !hasResponse;
      });

      if (firstUnansweredQuestion) {
        const chapterId = step.chapterId || chapterData.id;
        logger.info({
          message: 'Found next required step with unanswered questions',
          data: {
            stepIndex: i,
            stepLabel: step.label,
            chapterId,
            questionId: firstUnansweredQuestion.id,
          },
        });
        return { stepIndex: i, questionId: firstUnansweredQuestion.id };
      }
    }

    logger.info({
      message: 'No required unanswered questions found after current step',
    });
    return null;
  }

  /**
   * Calculate navigation skip result (for handleNavigationSkip)
   */
  static calculateSkipNavigation(ctx: NavigationContext): NavigationResult {
    const result = EFPNavigationUtils.findNextRequiredStep(ctx);

    if (result !== null) {
      const { stepIndex, questionId } = result;
      const nextStep = ctx.flatSteps[stepIndex];

      logger.info({
        message: 'Navigating to next required step',
        data: {
          stepIndex,
          stepLabel: nextStep.label,
          questionId,
        },
      });

      return {
        success: true,
        newStepIndex: stepIndex,
        newSectionIndex: nextStep.sectionIndex,
        newActiveContent: { title: nextStep.label, content: nextStep.content },
        scrollToQuestion: { questionId },
      };
    }

    // No required unanswered questions found - all questions are complete
    logger.info({
      message: 'No required unanswered questions found - navigating to Review & Submit',
    });

    if (ctx.canAccessReviewAndSubmit) {
      // Navigate to Review & Submit section (section index 1)
      const target = EFPNavigationUtils.navigateToSection(
        1,
        ctx.flatSteps,
        ctx.sections
      );

      if (target) {
        const step = ctx.flatSteps[target.stepIndex];

        logger.info({
          message: 'Navigating to Review & Submit section',
          data: {
            stepIndex: target.stepIndex,
            stepLabel: step.label,
          },
        });

        return {
          success: true,
          newStepIndex: target.stepIndex,
          newSectionIndex: target.sectionIndex,
          newActiveContent: { title: step.label, content: step.content },
          scrollToTop: true,
        };
      }
    }

    // Cannot access Review & Submit
    logger.warn({
      message: 'Cannot navigate to Review & Submit - incomplete questions',
    });
    return { success: false, showIncompleteAlert: true };
  }
}

