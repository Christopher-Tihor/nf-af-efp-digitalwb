import { WorkbookValidationService } from '../../js/services/WorkbookValidationService.ts';

// Mock global POWERPOD object
global.POWERPOD = {
  workbookQuestionsAndResponses: {
    questionsWithResponses: new Map(),
    isLoaded: true,
    stats: {
      totalQuestions: 0,
      answeredQuestions: 0,
      completionPercentage: 0,
    },
  },
  workbookData: {
    quartech_producersigned: false,
    quartech_pasigned: false,
  },
};

// Mock questionnaire functions
jest.mock('../../js/common/questionnaire.js', () => ({
  getChapterFromStore: jest.fn(),
  getAllChaptersFromStore: jest.fn(() => []),
}));

const { getChapterFromStore, getAllChaptersFromStore } = require('../../js/common/questionnaire.js');

describe('WorkbookValidationService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkbookValidationService();
    
    // Reset POWERPOD state
    global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.clear();
    global.POWERPOD.workbookData.quartech_producersigned = false;
    global.POWERPOD.workbookData.quartech_pasigned = false;
  });

  describe('isQuestionAnswered', () => {
    test('should return true for answered question', () => {
      const questionId = 'q1';
      
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set(questionId, {
        question: { id: questionId },
        response: {
          quartech_chapterskipped: 100000001, // NO
          quartech_response: 'Answer',
        },
      });

      expect(service.isQuestionAnswered(questionId)).toBe(true);
    });

    test('should return false for unanswered question', () => {
      const questionId = 'q1';
      
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set(questionId, {
        question: { id: questionId },
        response: {
          quartech_chapterskipped: 100000001, // NO
          quartech_response: '',
        },
      });

      expect(service.isQuestionAnswered(questionId)).toBe(false);
    });

    test('should return true for skipped question', () => {
      const questionId = 'q1';
      
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set(questionId, {
        question: { id: questionId },
        response: {
          quartech_chapterskipped: 100000000, // YES
          quartech_response: '',
        },
      });

      expect(service.isQuestionAnswered(questionId)).toBe(true);
    });

    test('should return false for non-existent question', () => {
      expect(service.isQuestionAnswered('non-existent')).toBe(false);
    });
  });

  describe('calculateCompletionPercentage', () => {
    test('should calculate percentage correctly', () => {
      // Set up 4 questions: 3 answered, 1 unanswered
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000001, quartech_response: 'Answer 1' },
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q2', {
        question: { id: 'q2' },
        response: { quartech_chapterskipped: 100000001, quartech_response: 'Answer 2' },
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q3', {
        question: { id: 'q3' },
        response: { quartech_chapterskipped: 100000001, quartech_response: 'Answer 3' },
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q4', {
        question: { id: 'q4' },
        response: { quartech_chapterskipped: 100000001, quartech_response: '' },
      });

      const percentage = service.calculateCompletionPercentage();
      expect(percentage).toBe(75); // 3/4 = 75%
    });

    test('should exclude skipped questions from total', () => {
      // Set up 4 questions: 2 answered, 1 skipped, 1 unanswered
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000001, quartech_response: 'Answer 1' },
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q2', {
        question: { id: 'q2' },
        response: { quartech_chapterskipped: 100000001, quartech_response: 'Answer 2' },
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q3', {
        question: { id: 'q3' },
        response: { quartech_chapterskipped: 100000000, quartech_response: '' }, // SKIPPED
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q4', {
        question: { id: 'q4' },
        response: { quartech_chapterskipped: 100000001, quartech_response: '' },
      });

      const percentage = service.calculateCompletionPercentage();
      // 2 answered out of 3 non-skipped = 66.67%
      expect(percentage).toBeCloseTo(66.67, 1);
    });

    test('should return 0 for no questions', () => {
      const percentage = service.calculateCompletionPercentage();
      expect(percentage).toBe(0);
    });

    test('should return 100 for all answered', () => {
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000001, quartech_response: 'Answer 1' },
      });

      const percentage = service.calculateCompletionPercentage();
      expect(percentage).toBe(100);
    });
  });

  describe('isChapterComplete', () => {
    test('should return true when all questions answered', () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [{ id: 'q1' }, { id: 'q2' }],
      });

      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000001, quartech_response: 'Answer 1' },
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q2', {
        question: { id: 'q2' },
        response: { quartech_chapterskipped: 100000001, quartech_response: 'Answer 2' },
      });

      expect(service.isChapterComplete(chapterId)).toBe(true);
    });

    test('should return false when some questions unanswered', () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [{ id: 'q1' }, { id: 'q2' }],
      });

      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000001, quartech_response: 'Answer 1' },
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q2', {
        question: { id: 'q2' },
        response: { quartech_chapterskipped: 100000001, quartech_response: '' },
      });

      expect(service.isChapterComplete(chapterId)).toBe(false);
    });

    test('should return true when chapter is skipped', () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [{ id: 'q1' }],
      });

      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000000, quartech_response: '' },
      });

      expect(service.isChapterComplete(chapterId)).toBe(true);
    });
  });

  describe('getIncompleteChapters', () => {
    test('should return incomplete chapters with details', () => {
      getAllChaptersFromStore.mockReturnValue([
        {
          id: 'chapter1',
          quartech_name: 'Chapter 1',
          questions: [{ id: 'q1' }, { id: 'q2' }],
        },
        {
          id: 'chapter2',
          quartech_name: 'Chapter 2',
          questions: [{ id: 'q3' }],
        },
      ]);

      // Chapter 1: 1/2 answered
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000001, quartech_response: 'Answer 1' },
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q2', {
        question: { id: 'q2' },
        response: { quartech_chapterskipped: 100000001, quartech_response: '' },
      });

      // Chapter 2: 1/1 answered
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q3', {
        question: { id: 'q3' },
        response: { quartech_chapterskipped: 100000001, quartech_response: 'Answer 3' },
      });

      const incomplete = service.getIncompleteChapters();
      expect(incomplete).toHaveLength(1);
      expect(incomplete[0]).toEqual({
        chapterId: 'chapter1',
        chapterName: 'Chapter 1',
        totalQuestions: 2,
        answeredQuestions: 1,
      });
    });

    test('should exclude skipped chapters', () => {
      getAllChaptersFromStore.mockReturnValue([
        {
          id: 'chapter1',
          quartech_name: 'Chapter 1',
          questions: [{ id: 'q1' }],
        },
      ]);

      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000000, quartech_response: '' },
      });

      const incomplete = service.getIncompleteChapters();
      expect(incomplete).toHaveLength(0);
    });
  });

  describe('canAccessReviewAndSubmit', () => {
    test('should return true when all chapters complete', () => {
      getAllChaptersFromStore.mockReturnValue([
        {
          id: 'chapter1',
          quartech_name: 'Chapter 1',
          questions: [{ id: 'q1' }],
        },
      ]);

      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000001, quartech_response: 'Answer 1' },
      });

      expect(service.canAccessReviewAndSubmit()).toBe(true);
    });

    test('should return false when some chapters incomplete', () => {
      getAllChaptersFromStore.mockReturnValue([
        {
          id: 'chapter1',
          quartech_name: 'Chapter 1',
          questions: [{ id: 'q1' }],
        },
      ]);

      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000001, quartech_response: '' },
      });

      expect(service.canAccessReviewAndSubmit()).toBe(false);
    });

    test('should return true when workbook is locked', () => {
      global.POWERPOD.workbookData.quartech_producersigned = true;

      getAllChaptersFromStore.mockReturnValue([
        {
          id: 'chapter1',
          quartech_name: 'Chapter 1',
          questions: [{ id: 'q1' }],
        },
      ]);

      // Even with incomplete questions
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000001, quartech_response: '' },
      });

      expect(service.canAccessReviewAndSubmit()).toBe(true);
    });
  });
});
