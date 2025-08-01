import { EFPSection, EFPSectionItem } from './types';

// Utility class for completion calculations
export class EFPCompletionUtils {
  static calculateOverallCompletion(sections: EFPSection[]): number {
    const allItems: EFPSectionItem[] = [];

    const collect = (items: EFPSectionItem[]) => {
      for (const item of items) {
        if ('items' in item && Array.isArray(item.items)) {
          collect(item.items);
        } else {
          allItems.push(item);
        }
      }
    };

    for (const section of sections) {
      collect(section.items);
    }

    const completed = allItems.filter((item) => item.complete).length;
    return allItems.length === 0
      ? 0
      : Math.round((completed / allItems.length) * 100);
  }

  static isSectionComplete(section: EFPSection): boolean {
    const leafItems: EFPSectionItem[] = [];

    const collect = (items: EFPSectionItem[]) => {
      for (const item of items) {
        if ('items' in item && Array.isArray(item.items)) {
          collect(item.items);
        } else {
          leafItems.push(item);
        }
      }
    };

    collect(section.items);
    return leafItems.every((item) => item.complete);
  }

  static getSectionProgress(section: EFPSection): { completed: number; total: number; percentage: number } {
    const leafItems: EFPSectionItem[] = [];

    const collect = (items: EFPSectionItem[]) => {
      for (const item of items) {
        if ('items' in item && Array.isArray(item.items)) {
          collect(item.items);
        } else {
          leafItems.push(item);
        }
      }
    };

    collect(section.items);
    
    const completed = leafItems.filter((item) => item.complete).length;
    const total = leafItems.length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { completed, total, percentage };
  }

  static getNextIncompleteItem(section: EFPSection): EFPSectionItem | null {
    const findIncomplete = (items: EFPSectionItem[]): EFPSectionItem | null => {
      for (const item of items) {
        if ('items' in item && Array.isArray(item.items)) {
          const found = findIncomplete(item.items);
          if (found) return found;
        } else if (!item.complete) {
          return item;
        }
      }
      return null;
    };

    return findIncomplete(section.items);
  }
}
