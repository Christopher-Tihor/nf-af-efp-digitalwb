import { EFPStep, EFPSection, EFPSectionItem, EFPSelectableStep } from './types';
import { EFPLogger } from './logger';

// Utility class for navigation helpers
export class EFPNavigationUtils {
  static isStepContainer(step: EFPStep, sections: EFPSection[]): boolean {
    // Check if this step corresponds to a container item
    // Container items are those that have 'items' property in the original structure
    // and are marked as containers, or have empty/placeholder content

    // If the step has no actual content or is marked as container
    if (!step.content || step.content === '') {
      return true;
    }

    // Check if this step corresponds to a main chapter container
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

    // Check if the step label matches a chapter container pattern (e.g., "Chapter 6", "Chapter 7")
    if (/^Chapter \d+$/.test(step.label)) {
      return true;
    }

    // Check if the step label matches a subchapter container pattern (e.g., "Chapter 6: Nutrient Application")
    if (/^Chapter \d+: /.test(step.label)) {
      // Check if there's a next step that would be a child of this container
      // This is a heuristic to determine if this is a container
      const flatSteps = EFPNavigationUtils.getFlatStepsFromSections(sections);
      const currentIndex = flatSteps.findIndex(s => s.label === step.label);
      if (currentIndex >= 0 && currentIndex < flatSteps.length - 1) {
        const nextStep = flatSteps[currentIndex + 1];
        if (nextStep && nextStep.label.length > step.label.length &&
            !nextStep.label.startsWith('Chapter ') &&
            nextStep.content && nextStep.content.trim() !== '') {
          return true;
        }
      }
    }

    // Check if the content contains the container message
    if (step.content && step.content.includes('Please select a specific chapter section')) {
      return true;
    }

    return false;
  }

  static findLastSelectableStepInSection(sectionIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): EFPSelectableStep | null {
    // Find all steps in the given section
    const stepsInSection: { step: EFPStep, index: number }[] = [];

    flatSteps.forEach((step, index) => {
      if (step.sectionIndex === sectionIndex) {
        stepsInSection.push({ step, index });
      }
    });

    // Go through the steps in reverse order to find the last selectable one
    for (let i = stepsInSection.length - 1; i >= 0; i--) {
      const { step, index } = stepsInSection[i];
      const isContainer = EFPNavigationUtils.isStepContainer(step, sections);

      if (!isContainer) {
        EFPLogger.log(`Found last selectable step in section ${sectionIndex}: "${step.label}" at index ${index}`);
        return { step, index };
      }
    }

    EFPLogger.warn(`No selectable steps found in section ${sectionIndex}`);
    return null;
  }

  static findFirstSelectableStepInSection(sectionIndex: number, flatSteps: EFPStep[], sections: EFPSection[]): EFPSelectableStep | null {
    // Find all steps in the given section
    const stepsInSection: { step: EFPStep, index: number }[] = [];

    flatSteps.forEach((step, index) => {
      if (step.sectionIndex === sectionIndex) {
        stepsInSection.push({ step, index });
      }
    });

    // Go through the steps in order to find the first selectable one (skip section headers)
    for (let i = 0; i < stepsInSection.length; i++) {
      const { step, index } = stepsInSection[i];
      const isContainer = EFPNavigationUtils.isStepContainer(step, sections);

      // Skip section headers like "Section A", "Section B", etc.
      if (!isContainer && !step.label.startsWith('Section ')) {
        EFPLogger.log(`Found first selectable step in section ${sectionIndex}: "${step.label}" at index ${index}`);
        return { step, index };
      }
    }

    EFPLogger.warn(`No selectable steps found in section ${sectionIndex}`);
    return null;
  }

  static findContainersForItem(itemLabel: string, sections: EFPSection[]): string[] {
    const containers: string[] = [];

    // Recursive function to search through the navigation structure
    const searchItems = (items: EFPSectionItem[], parentContainers: string[] = []) => {
      for (const item of items) {
        const currentPath = [...parentContainers];
        
        if ('items' in item && Array.isArray(item.items)) {
          // This is a container, add it to the current path
          if (item.title) {
            currentPath.push(item.title);
          }
          
          // Check if the target item exists in this container's children
          const foundInChildren = EFPNavigationUtils.itemExistsInChildren(item.items, itemLabel);
          if (foundInChildren) {
            containers.push(...currentPath);
          }

          // Recursively search children
          searchItems(item.items, currentPath);
        }
      }
    };

    // Search through all sections
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

  // Helper method to get flat steps from sections (used internally)
  private static getFlatStepsFromSections(sections: EFPSection[]): EFPStep[] {
    const result: EFPStep[] = [];

    const collect = (items: EFPSectionItem[], sectionIndex: number) => {
      for (const item of items) {
        if ('items' in item && Array.isArray(item.items)) {
          result.push({
            label: item.title || item.label,
            content: '', // Container items have no content
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

          // Add chapter data if it exists (for chapters)
          if (item.chapterData) {
            stepItem.chapterData = item.chapterData;
          }

          // Add subchapter data if it exists (for subchapters)
          if (item.subchapterData) {
            stepItem.subchapterData = item.subchapterData;
          }

          // Mark as container if specified
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
}
