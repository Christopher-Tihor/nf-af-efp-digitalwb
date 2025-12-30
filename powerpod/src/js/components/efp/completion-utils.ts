import { Logger } from '../../common/logger.js';
import { POWERPOD } from '../../common/constants.js';
import {
  isQuestionnaireLoaded,
  getQuestionnaireFromStore,
  getChapterFromStore,
  getQuestionFromStore,
} from '../../common/questionnaire.js';
import { EFPSection, EFPSectionItem } from './types.js';

const logger = Logger('components/efp/completion-utils');

// Context for completion checks that require component state
export interface CompletionContext {
  hasTriedToSubmit: boolean;
  getQuestionsForChapter: (chapterId: string, excludePreventSkipping?: boolean) => any[];
}

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
    return allItems.length === 0 ? 0 : Math.round((completed / allItems.length) * 100);
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

  /**
   * Get completion status for an item from the questionnaire store
   */
  static getCompletionFromStore(item: any): boolean {
    if (!isQuestionnaireLoaded()) {
      return item.complete || false;
    }

    try {
      // Check if this is a chapter item
      if (item.chapterId) {
        const chapter = getChapterFromStore(item.chapterId);
        return chapter?.complete || false;
      }

      // Check if this is a question item
      if (item.questionId) {
        const question = getQuestionFromStore(item.questionId);
        return question?.complete || false;
      }

      // For nested items (containers), check children completion recursively
      if ('items' in item && Array.isArray(item.items)) {
        return item.items.every((child: any) =>
          EFPCompletionUtils.getCompletionFromStore(child)
        );
      }

      return item.complete || false;
    } catch (error) {
      logger.warn({
        message: `Failed to get completion from questionnaire store: ${String(error)}`,
      });
      return item.complete || false;
    }
  }

  /**
   * Get section completion status from questionnaire store
   */
  static getSectionCompletionFromStore(section: any): boolean {
    // For My Workbook, use questionnaire store completion
    if (section.tab === 'My Workbook' && isQuestionnaireLoaded()) {
      try {
        const questionnaire = getQuestionnaireFromStore();
        if (questionnaire) {
          let totalQuestions = 0;
          let completedOrSkippedQuestions = 0;

          const countInChapters = (chapters: any[]) => {
            chapters.forEach((chapter: any) => {
              if (chapter.questions) {
                chapter.questions.forEach((question: any) => {
                  totalQuestions++;

                  const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(question.id);
                  const isSkipped = entry?.response?.quartech_chapterskipped === 100000000;
                  const hasResponse = entry?.response?.quartech_response &&
                                     entry.response.quartech_response.trim() !== '';

                  if (isSkipped || hasResponse) {
                    completedOrSkippedQuestions++;
                  }
                });
              }
              if (chapter.subchapters) {
                countInChapters(chapter.subchapters);
              }
            });
          };

          if (questionnaire.chapters && questionnaire.chapters.length > 0) {
            countInChapters(questionnaire.chapters[0]);
          }

          return totalQuestions > 0 && completedOrSkippedQuestions === totalQuestions;
        }
      } catch (error) {
        logger.warn({
          message: `Failed to get section completion from questionnaire store: ${String(error)}`,
        });
      }
    }

    return EFPCompletionUtils.isSectionComplete(section);
  }

  /**
   * Get section skipped status from questionnaire store
   */
  static getSectionSkippedFromStore(section: any): boolean {
    if (section.tab !== 'My Workbook') {
      return false;
    }

    if (!POWERPOD.workbookQuestionsAndResponses.isLoaded) {
      return false;
    }

    try {
      const questionnaire = getQuestionnaireFromStore();
      if (!questionnaire) {
        return false;
      }

      let totalQuestions = 0;
      let skippedQuestions = 0;

      const countInChapters = (chapters: any[]) => {
        chapters.forEach((chapter: any) => {
          if (chapter.questions) {
            chapter.questions.forEach((question: any) => {
              totalQuestions++;
              const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(question.id);
              if (entry?.response?.quartech_chapterskipped === 100000000) {
                skippedQuestions++;
              }
            });
          }
          if (chapter.subchapters) {
            countInChapters(chapter.subchapters);
          }
        });
      };

      if (questionnaire.chapters && questionnaire.chapters.length > 0) {
        countInChapters(questionnaire.chapters[0]);
      }

      return totalQuestions > 0 && skippedQuestions === totalQuestions;
    } catch (error) {
      logger.warn({
        message: `Failed to get section skipped status: ${String(error)}`,
      });
      return false;
    }
  }

  /**
   * Check if a chapter has incomplete questions from preventSkipping children
   */
  static hasIncompletePreventSkippingChildren(subchapters: any[]): boolean {
    for (const subchapter of subchapters) {
      if (subchapter.preventSkipping === true) {
        const questions = subchapter.questions || [];
        const hasIncompleteQuestions = questions.some((question: any) => {
          const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(question.id);
          const isSkipped = entry?.response?.quartech_chapterskipped === 100000000;
          const hasResponse = entry?.response?.quartech_response &&
                             entry.response.quartech_response.trim() !== '';

          return !isSkipped && !hasResponse;
        });

        if (hasIncompleteQuestions) {
          return true;
        }
      }

      if (subchapter.subchapters) {
        if (EFPCompletionUtils.hasIncompletePreventSkippingChildren(subchapter.subchapters)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if a chapter is skipped by ID
   */
  static isChapterSkippedById(
    chapterId: string,
    getQuestionsForChapter: (chapterId: string, excludePreventSkipping?: boolean) => any[]
  ): boolean {
    if (!chapterId) return false;

    const questions = getQuestionsForChapter(chapterId, true);
    if (questions.length === 0) return false;

    return questions.every(q => {
      const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(q.id);
      return entry?.response?.quartech_chapterskipped === 100000000;
    });
  }

  /**
   * Get skipped status for an item from the store
   */
  static getSkippedFromStore(
    item: EFPSectionItem,
    getQuestionsForChapter: (chapterId: string, excludePreventSkipping?: boolean) => any[]
  ): boolean {
    if (!item.chapterId) {
      return false;
    }

    try {
      const isSkipped = EFPCompletionUtils.isChapterSkippedById(item.chapterId, getQuestionsForChapter);

      if (!isSkipped) {
        return false;
      }

      const chapter = getChapterFromStore(item.chapterId);
      if ((chapter as any)?.subchapters) {
        const hasIncomplete = EFPCompletionUtils.hasIncompletePreventSkippingChildren((chapter as any).subchapters);
        if (hasIncomplete) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error({
        message: 'Error checking chapter skipped status',
        data: { chapterId: item.chapterId, error: (error as Error).message },
      });
      return false;
    }
  }

  /**
   * Get incomplete status for an item from the store
   */
  static getIncompleteFromStore(
    item: EFPSectionItem,
    ctx: CompletionContext
  ): boolean {
    if (!ctx.hasTriedToSubmit) {
      return false;
    }

    if (!item.chapterId) {
      return false;
    }

    try {
      const questions = ctx.getQuestionsForChapter(item.chapterId);
      if (questions.length === 0) {
        return false;
      }

      return questions.some((question: any) => {
        const entry = POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get(question.id);
        const isSkipped = entry?.response?.quartech_chapterskipped === 100000000;
        const hasResponse = entry?.response?.quartech_response &&
                           entry.response.quartech_response.trim() !== '';

        return !isSkipped && !hasResponse;
      });
    } catch (error) {
      logger.error({
        message: 'Error checking chapter incomplete status',
        data: { chapterId: item.chapterId, error: (error as Error).message },
      });
      return false;
    }
  }
}

