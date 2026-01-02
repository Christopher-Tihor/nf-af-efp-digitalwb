import { Logger } from '../../common/logger.js';
import { POWERPOD } from '../../common/constants.js';
import {
  isQuestionnaireLoaded,
  getQuestionnaireFromStore,
  getChapterFromStore,
  getQuestionFromStore,
} from '../../common/questionnaire.js';
import { getChapterById } from '../../common/chaptersAndQuestionsUtils.js';
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
   * Check if an item has any questions (directly or in nested subchapters)
   * Duplicated from EFPRenderUtils to avoid circular dependency
   */
  private static itemHasQuestions(item: EFPSectionItem): boolean {
    // Check direct questions on chapter or subchapter data
    const chapterQuestions = item.chapterData?.questions?.length || 0;
    const subchapterQuestions = item.subchapterData?.questions?.length || 0;

    if (chapterQuestions > 0 || subchapterQuestions > 0) {
      return true;
    }

    // Check nested subchapters in chapter data
    if (item.chapterData?.subchapters) {
      for (const sub of item.chapterData.subchapters) {
        if (sub.questions?.length > 0) {
          return true;
        }
        if (sub.subchapters) {
          for (const nestedSub of sub.subchapters) {
            if (nestedSub.questions?.length > 0) {
              return true;
            }
          }
        }
      }
    }

    // Check nested subchapters in subchapter data
    if (item.subchapterData?.subchapters) {
      for (const sub of item.subchapterData.subchapters) {
        if (sub.questions?.length > 0) {
          return true;
        }
      }
    }

    // Check nested items
    if (item.items) {
      for (const childItem of item.items) {
        if (EFPCompletionUtils.itemHasQuestions(childItem)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if a subchapter (from data model) is skipped
   *
   * IMPORTANT: Items without questions should return FALSE (not skipped)
   * This prevents the checkbox from appearing checked on fresh workbooks
   * for chapters that simply have no questions.
   */
  private static isSubchapterSkipped(
    subchapter: any,
    getQuestionsForChapter: (chapterId: string, excludePreventSkipping?: boolean) => any[]
  ): boolean {
    if (!subchapter?.id) return false; // No ID means can't check, default to not skipped

    // Check if this subchapter has questions
    const hasQuestions = subchapter.questions?.length > 0;

    // If this subchapter has its own subchapters, check if ALL of them are skipped
    if (subchapter.subchapters && subchapter.subchapters.length > 0) {
      const subchaptersWithQuestions = subchapter.subchapters.filter((sub: any) => {
        // Check if sub has questions directly or in nested subchapters
        if (sub.questions?.length > 0) return true;
        if (sub.subchapters) {
          return sub.subchapters.some((nested: any) => nested.questions?.length > 0);
        }
        return false;
      });

      // If no subchapters have questions, consider the parent's own questions
      if (subchaptersWithQuestions.length === 0) {
        if (!hasQuestions) return false; // No questions anywhere, NOT skipped
        return EFPCompletionUtils.isChapterSkippedById(subchapter.id, getQuestionsForChapter);
      }

      // Check if all subchapters with questions are skipped
      return subchaptersWithQuestions.every((sub: any) =>
        EFPCompletionUtils.isSubchapterSkipped(sub, getQuestionsForChapter)
      );
    }

    // For leaf subchapters, check if all questions are skipped
    if (!hasQuestions) return false; // No questions, NOT skipped
    return EFPCompletionUtils.isChapterSkippedById(subchapter.id, getQuestionsForChapter);
  }

  /**
   * Get skipped status for an item from the store
   *
   * For parent chapters with subchapters:
   * - Show as skipped ONLY if ALL subchapters (with questions) are skipped
   * - Items without questions are ignored when determining parent status
   * - If some subchapters are skipped but others are not, show as complete (not skipped)
   *
   * For leaf chapters (no subchapters):
   * - Show as skipped if all questions are skipped
   *
   * IMPORTANT: Items without questions should return FALSE (not skipped)
   * This prevents the checkbox from appearing checked on fresh workbooks.
   */
  static getSkippedFromStore(
    item: EFPSectionItem,
    getQuestionsForChapter: (chapterId: string, excludePreventSkipping?: boolean) => any[]
  ): boolean {
    // Items without chapterId - check children if available
    if (!item.chapterId) {
      // If this item has no chapterId but has children, check the children
      if ('items' in item && Array.isArray(item.items) && item.items.length > 0) {
        const childrenWithQuestions = item.items.filter(child =>
          EFPCompletionUtils.itemHasQuestions(child)
        );

        // If no children have questions, treat as NOT skipped (fresh workbook case)
        if (childrenWithQuestions.length === 0) {
          return false;
        }

        // Check if all children with questions are skipped
        return childrenWithQuestions.every((childItem) =>
          EFPCompletionUtils.getSkippedFromStore(childItem, getQuestionsForChapter)
        );
      }
      // No chapterId and no children - treat as NOT skipped
      return false;
    }

    try {
      const chapter = getChapterFromStore(item.chapterId);

      // For items with subitems (parent chapters), check if ALL subitems with questions are skipped
      if ('items' in item && Array.isArray(item.items) && item.items.length > 0) {
        // Filter to only children that have questions
        const childrenWithQuestions = item.items.filter(child =>
          EFPCompletionUtils.itemHasQuestions(child)
        );

        // If no children have questions, check the parent's own questions
        if (childrenWithQuestions.length === 0) {
          return EFPCompletionUtils.isChapterSkippedById(item.chapterId, getQuestionsForChapter);
        }

        // Check if ALL child items with questions are skipped
        const allChildrenSkipped = childrenWithQuestions.every((childItem) =>
          EFPCompletionUtils.getSkippedFromStore(childItem, getQuestionsForChapter)
        );

        // Parent is only skipped if ALL children with questions are skipped
        return allChildrenSkipped;
      }

      // For chapters with subchapters in the data model (but not in items), check subchapters
      if ((chapter as any)?.subchapters && (chapter as any).subchapters.length > 0) {
        // Filter to only subchapters that have questions
        const subchaptersWithQuestions = (chapter as any).subchapters.filter((sub: any) => {
          if (sub.questions?.length > 0) return true;
          if (sub.subchapters) {
            return sub.subchapters.some((nested: any) => nested.questions?.length > 0);
          }
          return false;
        });

        // If no subchapters have questions, check the parent's own questions
        if (subchaptersWithQuestions.length === 0) {
          return EFPCompletionUtils.isChapterSkippedById(item.chapterId, getQuestionsForChapter);
        }

        const allSubchaptersSkipped = subchaptersWithQuestions.every((subchapter: any) =>
          EFPCompletionUtils.isSubchapterSkipped(subchapter, getQuestionsForChapter)
        );

        // Parent is only skipped if ALL subchapters with questions are skipped
        return allSubchaptersSkipped;
      }

      // For leaf chapters (no subchapters), use the original logic
      const isSkipped = EFPCompletionUtils.isChapterSkippedById(item.chapterId, getQuestionsForChapter);

      if (!isSkipped) {
        return false;
      }

      // Additional check for preventSkipping children
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

// ============================================================
// Console Debug Helpers - Exposed on POWERPOD.completionUtils
// ============================================================

/**
 * Check if a specific question is complete
 */
function isQuestionComplete(questionId: string): boolean {
  const entry = POWERPOD.workbookQuestionsAndResponses?.questionsWithResponses?.get(questionId);
  if (!entry?.response) return false;

  const isSkipped = entry.response.quartech_chapterskipped === 100000000;
  const hasResponse = entry.response.quartech_response && entry.response.quartech_response.trim() !== '';

  return isSkipped || hasResponse;
}

interface QuestionResult {
  questionId: string;
  questionName: string;
  chapterId: string | null;
  chapterName: string | null;
  question: any;
  response: any;
}

/**
 * Get all incomplete questions
 */
function getIncompleteQuestions(): QuestionResult[] {
  const incomplete: QuestionResult[] = [];

  if (!POWERPOD.workbookQuestionsAndResponses?.questionsWithResponses) {
    return incomplete;
  }

  POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.forEach((entry: any, questionId: string) => {
    const response = entry.response;
    const isSkipped = response?.quartech_chapterskipped === 100000000;
    const hasResponse = response?.quartech_response && response.quartech_response.trim() !== '';

    if (!isSkipped && !hasResponse) {
      const chapterId = entry.question?._quartech_chapter_value || null;
      const chapter = chapterId ? getChapterById(chapterId) : null;

      incomplete.push({
        questionId,
        questionName: entry.question?.quartech_name || 'Unknown',
        chapterId,
        chapterName: chapter?.quartech_name || null,
        question: entry.question,
        response: entry.response,
      });
    }
  });

  return incomplete;
}

/**
 * Get all complete questions
 */
function getCompleteQuestions(): QuestionResult[] {
  const complete: QuestionResult[] = [];

  if (!POWERPOD.workbookQuestionsAndResponses?.questionsWithResponses) {
    return complete;
  }

  POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.forEach((entry: any, questionId: string) => {
    const response = entry.response;
    const isSkipped = response?.quartech_chapterskipped === 100000000;
    const hasResponse = response?.quartech_response && response.quartech_response.trim() !== '';

    if (isSkipped || hasResponse) {
      const chapterId = entry.question?._quartech_chapter_value || null;
      const chapter = chapterId ? getChapterById(chapterId) : null;

      complete.push({
        questionId,
        questionName: entry.question?.quartech_name || 'Unknown',
        chapterId,
        chapterName: chapter?.quartech_name || null,
        question: entry.question,
        response: entry.response,
      });
    }
  });

  return complete;
}

/**
 * Get completion summary for all questions
 */
function getCompletionSummary(): {
  total: number;
  complete: number;
  incomplete: number;
  skipped: number;
  percentage: number;
} {
  let total = 0;
  let complete = 0;
  let incomplete = 0;
  let skipped = 0;

  if (!POWERPOD.workbookQuestionsAndResponses?.questionsWithResponses) {
    return { total, complete, incomplete, skipped, percentage: 0 };
  }

  POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.forEach((entry: any) => {
    total++;
    const response = entry.response;
    const isSkipped = response?.quartech_chapterskipped === 100000000;
    const hasResponse = response?.quartech_response && response.quartech_response.trim() !== '';

    if (isSkipped) {
      skipped++;
      complete++;
    } else if (hasResponse) {
      complete++;
    } else {
      incomplete++;
    }
  });

  const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;

  return { total, complete, incomplete, skipped, percentage };
}

/**
 * Get question details by ID
 */
function getQuestionDetails(questionId: string): {
  questionId: string;
  questionName: string;
  chapterId: string | null;
  chapterName: string | null;
  question: any;
  response: any;
  isComplete: boolean;
  isSkipped: boolean;
} | null {
  const entry = POWERPOD.workbookQuestionsAndResponses?.questionsWithResponses?.get(questionId);
  if (!entry) return null;

  const response = entry.response;
  const isSkipped = response?.quartech_chapterskipped === 100000000;
  const hasResponse = response?.quartech_response && response.quartech_response.trim() !== '';

  const chapterId = entry.question?._quartech_chapter_value || null;
  const chapter = chapterId ? getChapterById(chapterId) : null;

  return {
    questionId,
    questionName: entry.question?.quartech_name || 'Unknown',
    chapterId,
    chapterName: chapter?.quartech_name || null,
    question: entry.question,
    response: entry.response,
    isComplete: isSkipped || hasResponse,
    isSkipped,
  };
}

// Export debug helpers to POWERPOD global object
POWERPOD.completionUtils = {
  isQuestionComplete,
  getIncompleteQuestions,
  getCompleteQuestions,
  getCompletionSummary,
  getQuestionDetails,
  EFPCompletionUtils,
};

