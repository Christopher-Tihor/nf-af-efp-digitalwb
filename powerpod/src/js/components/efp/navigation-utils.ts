import { Logger } from '../../common/logger.js';

import { EFPStep, EFPSection, EFPSectionItem } from './types.js';

const logger = Logger('components/efp/navigation-utils');

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

    for (let i = stepsInSection.length - 1; i >= 0; i--) {
      const { step, index } = stepsInSection[i];
      const isContainer = EFPNavigationUtils.isStepContainer(step, sections);

      if (!isContainer) {
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

    for (let i = 0; i < stepsInSection.length; i++) {
      const { step, index } = stepsInSection[i];
      const isContainer = EFPNavigationUtils.isStepContainer(step, sections);

      if (!isContainer && !step.label.startsWith('Section ')) {
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
          result.push({
            label: item.title || item.label,
            content: item.content ?? '',
            sectionIndex,
            isContainer: true,
          });
          collect(item.items, sectionIndex);
        } else {
          const stepItem: EFPStep = {
            label: item.label,
            content: item.content ?? '',
            complete: item.complete ?? false,
            sectionIndex,
          };

          if (item.chapterData) {
            stepItem.chapterData = item.chapterData;
          }

          if (item.subchapterData) {
            stepItem.subchapterData = item.subchapterData;
          }

          if (item.isContainer) {
            stepItem.isContainer = item.isContainer;
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
    for (let i = currentIndex + 1; i < flatSteps.length; i++) {
      const step = flatSteps[i];
      if (!EFPNavigationUtils.isStepContainer(step, sections) && !step.label.startsWith('Section ')) {
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
    for (let i = currentIndex - 1; i >= 0; i--) {
      const step = flatSteps[i];
      if (!EFPNavigationUtils.isStepContainer(step, sections) && !step.label.startsWith('Section ')) {
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
}

