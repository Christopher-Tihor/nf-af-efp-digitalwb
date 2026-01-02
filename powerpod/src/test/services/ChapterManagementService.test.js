// Mock Logger before importing ChapterManagementService
jest.mock('../../js/common/logger.js', () => ({
  Logger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }),
}));

// Create a shared POWERPOD object that will be used by both the test and the mocked module
// This needs to be defined before the mock factory is called
const mockQuestionsWithResponses = new Map();
const mockPOWERPOD = {
  workbookQuestionsAndResponses: {
    questionsWithResponses: mockQuestionsWithResponses,
    isLoaded: true,
  },
  fetch: {
    patchWorkbookResponseData: jest.fn().mockResolvedValue({}),
  },
};

// Mock constants to use our shared POWERPOD object
jest.mock('../../js/common/constants.js', () => {
  return {
    get POWERPOD() {
      return mockPOWERPOD;
    },
    YES_VALUE: 100000000,
  };
});

import { ChapterManagementService } from '../../js/services/ChapterManagementService.ts';

// Also set global.POWERPOD for backward compatibility
global.POWERPOD = mockPOWERPOD;

// Mock questionnaire functions
jest.mock('../../js/common/questionnaire.js', () => ({
  getChapterFromStore: jest.fn(),
  updateQuestionResponse: jest.fn(),
  updateQuestionnaireCompletion: jest.fn(),
}));

// Mock workbook functions
jest.mock('../../js/common/workbookUtils.js', () => ({
  getWorkbookId: jest.fn(() => 'test-workbook-id'),
}));

// Mock WorkbookResponseHelper
jest.mock('../../js/common/workbookResponseHelper.js', () => ({
  default: {
    createResponse: jest.fn().mockResolvedValue({
      response: { quartech_workbookresponseid: 'new-response-id' },
    }),
  },
}));

const { getChapterFromStore } = require('../../js/common/questionnaire.js');

describe('ChapterManagementService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChapterManagementService();
    
    // Reset POWERPOD state
    global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.clear();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('isChapterSkipped', () => {
    test('should return true when all questions are skipped', () => {
      const chapterId = 'chapter1';

      // Mock chapter with questions
      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [
          { id: 'q1' },
          { id: 'q2' },
        ],
      });

      // Set up skipped responses
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000000 }, // YES
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q2', {
        question: { id: 'q2' },
        response: { quartech_chapterskipped: 100000000 }, // YES
      });

      expect(service.isChapterSkipped(chapterId)).toBe(true);
    });

    test('should return false when some questions are not skipped', () => {
      const chapterId = 'chapter1';
      
      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [
          { id: 'q1' },
          { id: 'q2' },
        ],
      });

      // One skipped, one not
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000000 }, // YES
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q2', {
        question: { id: 'q2' },
        response: { quartech_chapterskipped: 100000001 }, // NO
      });

      expect(service.isChapterSkipped(chapterId)).toBe(false);
    });

    test('should exclude questions from preventSkipping subchapters', () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [{ id: 'q1' }],
        subchapters: [
          {
            id: 'subchapter1',
            preventSkipping: true,
            questions: [{ id: 'q2' }],
          },
        ],
      });

      // Only q1 is skipped (q2 is in preventSkipping subchapter)
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: { quartech_chapterskipped: 100000000 }, // YES
      });

      expect(service.isChapterSkipped(chapterId)).toBe(true);
    });

    test('should return false when response is null (fresh workbook)', () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [
          { id: 'q1' },
          { id: 'q2' },
        ],
      });

      // Fresh workbook: questions exist but responses are null
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: null,
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q2', {
        question: { id: 'q2' },
        response: null,
      });

      expect(service.isChapterSkipped(chapterId)).toBe(false);
    });

    test('should return false when questions are not in the map', () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [
          { id: 'q1' },
          { id: 'q2' },
        ],
      });

      // Map is empty - questions not loaded yet
      // (questionsWithResponses is already cleared in beforeEach)

      expect(service.isChapterSkipped(chapterId)).toBe(false);
    });

    test('should return false for parent chapter with only preventSkipping subchapters (fresh workbook)', () => {
      const chapterId = 'chapter1';

      // Parent chapter has no direct questions, only subchapters with preventSkipping
      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [], // No direct questions
        subchapters: [
          {
            id: 'subchapter1',
            preventSkipping: true,
            questions: [{ id: 'q1' }],
          },
          {
            id: 'subchapter2',
            preventSkipping: true,
            questions: [{ id: 'q2' }],
          },
        ],
      });

      // Fresh workbook: questions exist but responses are null
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: null,
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q2', {
        question: { id: 'q2' },
        response: null,
      });

      // Should return false because there are no skippable questions
      // (all questions are in preventSkipping subchapters)
      expect(service.isChapterSkipped(chapterId)).toBe(false);
    });
  });

  describe('isSkippingPrevented', () => {
    test('should return true when chapter has preventSkipping', () => {
      const chapterId = 'chapter1';
      
      getChapterFromStore.mockReturnValue({
        id: chapterId,
        quartech_preventskipping: 100000000, // YES
      });

      expect(service.isSkippingPrevented(chapterId)).toBe(true);
    });

    test('should return false when chapter does not have preventSkipping', () => {
      const chapterId = 'chapter1';
      
      getChapterFromStore.mockReturnValue({
        id: chapterId,
        quartech_preventskipping: 100000001, // NO
      });

      expect(service.isSkippingPrevented(chapterId)).toBe(false);
    });

    test('should cascade from parent chapter', () => {
      const chapterId = 'subchapter1';
      const parentChapterId = 'chapter1';
      
      // Subchapter doesn't have preventSkipping, but parent does
      getChapterFromStore.mockImplementation((id) => {
        if (id === chapterId) {
          return {
            id: chapterId,
            parentChapterId: parentChapterId,
            quartech_preventskipping: 100000001, // NO
          };
        }
        if (id === parentChapterId) {
          return {
            id: parentChapterId,
            quartech_preventskipping: 100000000, // YES
          };
        }
      });

      expect(service.isSkippingPrevented(chapterId)).toBe(true);
    });
  });

  describe('getQuestionsForChapter', () => {
    test('should return all questions including subchapters', () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [{ id: 'q1' }, { id: 'q2' }],
        subchapters: [
          {
            id: 'subchapter1',
            questions: [{ id: 'q3' }],
          },
        ],
      });

      const questions = service.getQuestionsForChapter(chapterId);
      expect(questions).toHaveLength(3);
      expect(questions.map(q => q.id)).toEqual(['q1', 'q2', 'q3']);
    });

    test('should exclude questions from preventSkipping subchapters when requested', () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [{ id: 'q1' }],
        subchapters: [
          {
            id: 'subchapter1',
            preventSkipping: true,
            questions: [{ id: 'q2' }],
          },
          {
            id: 'subchapter2',
            preventSkipping: false,
            questions: [{ id: 'q3' }],
          },
        ],
      });

      const questions = service.getQuestionsForChapter(chapterId, true);
      expect(questions).toHaveLength(2);
      expect(questions.map(q => q.id)).toEqual(['q1', 'q3']);
    });
  });

  describe('handleChapterSkippedChange', () => {
    test('should skip all questions in chapter', async () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [{ id: 'q1' }, { id: 'q2' }],
      });

      // Set up existing responses
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: {
          quartech_workbookresponseid: 'resp1',
          quartech_chapterskipped: 100000001, // NO
          quartech_response: 'Answer 1',
        },
      });

      await service.handleChapterSkippedChange(chapterId, true);

      // Should have updated the response
      const entry = global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get('q1');
      expect(entry.response.quartech_chapterskipped).toBe(100000000); // YES
      expect(entry.response.quartech_response).toBe(''); // Cleared
    });

    test('should emit chapter-skipped-changed event', async () => {
      const chapterId = 'chapter1';
      const eventHandler = jest.fn();

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [{ id: 'q1' }],
      });

      service.on('chapter-skipped-changed', eventHandler);
      await service.handleChapterSkippedChange(chapterId, true);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          chapterId,
          isSkipped: true,
        })
      );
    });

    test('should unskip all questions in chapter', async () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [{ id: 'q1' }],
      });

      // Set up skipped response
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: {
          quartech_workbookresponseid: 'resp1',
          quartech_chapterskipped: 100000000, // YES
          quartech_response: '',
        },
      });

      await service.handleChapterSkippedChange(chapterId, false);

      // Should have updated the response
      const entry = global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.get('q1');
      expect(entry.response.quartech_chapterskipped).toBe(100000001); // NO
    });
  });

  describe('getChapterCompletionStatus', () => {
    test('should calculate completion correctly', () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }],
      });

      // Set up responses: 2 answered, 1 unanswered
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: {
          quartech_chapterskipped: 100000001, // NO
          quartech_response: 'Answer 1',
        },
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q2', {
        question: { id: 'q2' },
        response: {
          quartech_chapterskipped: 100000001, // NO
          quartech_response: 'Answer 2',
        },
      });
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q3', {
        question: { id: 'q3' },
        response: {
          quartech_chapterskipped: 100000001, // NO
          quartech_response: '',
        },
      });

      const status = service.getChapterCompletionStatus(chapterId);
      expect(status.totalQuestions).toBe(3);
      expect(status.answeredQuestions).toBe(2);
      expect(status.isComplete).toBe(false);
      expect(status.isSkipped).toBe(false);
    });

    test('should mark chapter as complete when all answered', () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [{ id: 'q1' }],
      });

      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: {
          quartech_chapterskipped: 100000001, // NO
          quartech_response: 'Answer 1',
        },
      });

      const status = service.getChapterCompletionStatus(chapterId);
      expect(status.isComplete).toBe(true);
    });

    test('should mark chapter as skipped when all questions skipped', () => {
      const chapterId = 'chapter1';

      getChapterFromStore.mockReturnValue({
        id: chapterId,
        questions: [{ id: 'q1' }],
      });

      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set('q1', {
        question: { id: 'q1' },
        response: {
          quartech_chapterskipped: 100000000, // YES
          quartech_response: '',
        },
      });

      const status = service.getChapterCompletionStatus(chapterId);
      expect(status.isSkipped).toBe(true);
      expect(status.isComplete).toBe(true); // Skipped chapters are considered complete
    });
  });
});
