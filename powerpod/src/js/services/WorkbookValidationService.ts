import { Logger } from '../common/logger.js';
import { POWERPOD } from '../common/constants.js';
import { ChapterManagementService } from './ChapterManagementService.js';
import { getAllChaptersFromStore } from '../common/questionnaire.js';

const logger = Logger('services/WorkbookValidationService');

export interface IncompleteChapter {
  chapterId: string;
  chapterName: string;
  totalQuestions: number;
  answeredQuestions: number;
}

/**
 * Service responsible for workbook validation
 * Handles completion checking, validation rules, and access control
 */
export class WorkbookValidationService {
  private chapterService: ChapterManagementService;

  constructor(chapterService: ChapterManagementService) {
    this.chapterService = chapterService;
    logger.info({ message: 'WorkbookValidationService initialized' });
  }

  /**
   * Clean up all state
   */
  cleanup(): void {
    logger.info({ message: 'WorkbookValidationService cleaned up' });
  }

  /**
   * Check if user can access Review & Submit
   * Returns true if all questions are answered or their chapters are skipped
   */
  canAccessReviewAndSubmit(): boolean {
    const incompleteChapters = this.getIncompleteChapters();
    return incompleteChapters.length === 0;
  }

  /**
   * Get list of incomplete chapters (chapters with unanswered questions that are not skipped)
   */
  getIncompleteChapters(): IncompleteChapter[] {
    const incompleteChapters: IncompleteChapter[] = [];
    const chapters = getAllChaptersFromStore();

    if (!chapters || chapters.length === 0) {
      return incompleteChapters;
    }

    // Iterate through all chapters
    chapters.forEach((chapter: any) => {
      const chapterId = chapter.id || chapter.quartech_chapterid;
      if (!chapterId) return;

      // Skip "My Action Plan" chapter (it's always accessible)
      if (chapter.quartech_name === 'My Action Plan' || chapter.name === 'My Action Plan') {
        return;
      }

      const completionStatus = this.chapterService.getChapterCompletionStatus(chapterId);

      // If chapter is not complete and not skipped, add to incomplete list
      if (!completionStatus.isComplete && !completionStatus.isSkipped) {
        incompleteChapters.push({
          chapterId,
          chapterName: chapter.quartech_name || chapter.name || 'Unnamed Chapter',
          totalQuestions: completionStatus.totalQuestions,
          answeredQuestions: completionStatus.answeredQuestions,
        });
      }
    });

    return incompleteChapters;
  }

  /**
   * Calculate overall workbook completion percentage
   * Skipped questions are excluded from the calculation
   */
  calculateCompletionPercentage(): number {
    let totalNonSkippedQuestions = 0;
    let answeredNonSkippedQuestions = 0;

    // Use the POWERPOD.workbookQuestionsAndResponses structure
    if (!POWERPOD.workbookQuestionsAndResponses?.questionsWithResponses) {
      return 0;
    }

    POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.forEach((entry: any, questionId: string) => {
      const response = entry.response;

      // Skip if question is marked as chapter-skipped
      if (response?.quartech_chapterskipped === 100000000) {
        return; // Skip this question
      }

      // Count as a non-skipped question
      totalNonSkippedQuestions++;

      // Check if answered
      if (response?.quartech_response && response.quartech_response.trim() !== '') {
        answeredNonSkippedQuestions++;
      }
    });

    if (totalNonSkippedQuestions === 0) {
      return 0;
    }

    return Math.round((answeredNonSkippedQuestions / totalNonSkippedQuestions) * 100);
  }

  /**
   * Validate if a question is answered
   */
  isQuestionAnswered(questionId: string): boolean {
    const entry = POWERPOD.workbookQuestionsAndResponses?.questionsWithResponses?.get(questionId);
    if (!entry?.response) return false;

    // Question is answered if it has a response OR is skipped
    const isSkipped = entry.response.quartech_chapterskipped === 100000000;
    const hasResponse = entry.response.quartech_response && entry.response.quartech_response.trim() !== '';

    return isSkipped || hasResponse;
  }

  /**
   * Validate if all questions in a chapter are answered (or chapter is skipped)
   */
  isChapterComplete(chapterId: string): boolean {
    const completionStatus = this.chapterService.getChapterCompletionStatus(chapterId);
    return completionStatus.isComplete;
  }

  /**
   * Get validation summary for the entire workbook
   */
  getValidationSummary(): {
    totalChapters: number;
    completeChapters: number;
    incompleteChapters: number;
    skippedChapters: number;
    totalQuestions: number;
    answeredQuestions: number;
    completionPercentage: number;
    canSubmit: boolean;
  } {
    let totalChapters = 0;
    let completeChapters = 0;
    let incompleteChapters = 0;
    let skippedChapters = 0;
    let totalQuestions = 0;
    let answeredQuestions = 0;

    const chapters = getAllChaptersFromStore();
    if (!chapters || chapters.length === 0) {
      return {
        totalChapters: 0,
        completeChapters: 0,
        incompleteChapters: 0,
        skippedChapters: 0,
        totalQuestions: 0,
        answeredQuestions: 0,
        completionPercentage: 0,
        canSubmit: false,
      };
    }

    chapters.forEach((chapter: any) => {
      const chapterId = chapter.id || chapter.quartech_chapterid;
      if (!chapterId) return;

      // Skip "My Action Plan" chapter
      if (chapter.quartech_name === 'My Action Plan' || chapter.name === 'My Action Plan') {
        return;
      }

      totalChapters++;

      const completionStatus = this.chapterService.getChapterCompletionStatus(chapterId);

      if (completionStatus.isSkipped) {
        skippedChapters++;
        completeChapters++; // Skipped chapters count as complete
      } else {
        totalQuestions += completionStatus.totalQuestions;
        answeredQuestions += completionStatus.answeredQuestions;

        if (completionStatus.isComplete) {
          completeChapters++;
        } else {
          incompleteChapters++;
        }
      }
    });

    const completionPercentage = this.calculateCompletionPercentage();
    const canSubmit = this.canAccessReviewAndSubmit();

    return {
      totalChapters,
      completeChapters,
      incompleteChapters,
      skippedChapters,
      totalQuestions,
      answeredQuestions,
      completionPercentage,
      canSubmit,
    };
  }
}

