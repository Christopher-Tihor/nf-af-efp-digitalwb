import { WorkbookResponseService } from '../../js/services/WorkbookResponseService.ts';

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
  workbookResponses: {
    responsesByQuestion: {},
  },
  fetch: {
    patchWorkbookResponseData: jest.fn(),
    postWorkbookResponseData: jest.fn(),
  },
};

// Mock WorkbookResponseHelper
jest.mock('../../js/common/workbookResponseHelper.js', () => ({
  default: {
    createResponse: jest.fn(),
    updateResponse: jest.fn(),
    getQuestionAndResponseFromMemory: jest.fn(),
  },
}));

// Mock questionnaire functions
jest.mock('../../js/common/questionnaire.js', () => ({
  getQuestionFromStore: jest.fn((questionId) => ({
    id: questionId,
    quartech_name: `Question ${questionId}`,
    quartech_ratingdescription1: 'Rating 1',
    quartech_ratingdescription2: 'Rating 2',
    quartech_ratingdescription3: 'Rating 3',
    quartech_ratingdescription4: 'Rating 4',
  })),
  updateQuestionResponse: jest.fn(),
  updateQuestionnaireCompletion: jest.fn(),
}));

// Mock workbook functions
jest.mock('../../js/common/workbookUtils.js', () => ({
  getWorkbookId: jest.fn(() => 'test-workbook-id'),
}));

describe('WorkbookResponseService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    service = new WorkbookResponseService();
    
    // Reset POWERPOD state
    global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.clear();
    global.POWERPOD.workbookResponses.responsesByQuestion = {};
  });

  afterEach(() => {
    service.cleanup();
    jest.useRealTimers();
  });

  describe('handleRatingChange', () => {
    test('should store pending value and debounce save for 1000ms', () => {
      const questionId = 'q1';
      const value = '2';

      service.handleRatingChange(questionId, value);

      // Pending value should be stored immediately
      expect(service.getPendingResponseValue(questionId)).toBe(value);

      // Should not have saved yet
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).not.toHaveBeenCalled();

      // Fast-forward 999ms - should still not save
      jest.advanceTimersByTime(999);
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).not.toHaveBeenCalled();

      // Fast-forward 1ms more (total 1000ms) - should save
      jest.advanceTimersByTime(1);
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).toHaveBeenCalled();
    });

    test('should cancel previous timer when value changes rapidly', () => {
      const questionId = 'q1';

      service.handleRatingChange(questionId, '1');
      jest.advanceTimersByTime(500);

      service.handleRatingChange(questionId, '2');
      jest.advanceTimersByTime(500);

      // Should not have saved yet (timer was reset)
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).not.toHaveBeenCalled();

      // Fast-forward another 500ms (total 1000ms from second change)
      jest.advanceTimersByTime(500);
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).toHaveBeenCalledTimes(1);
    });

    test('should emit response-saved event after save', async () => {
      const questionId = 'q1';
      const value = '2';
      const eventHandler = jest.fn();

      service.on('response-saved', eventHandler);
      service.handleRatingChange(questionId, value);

      // Fast-forward to trigger save
      jest.advanceTimersByTime(1000);

      // Wait for async operations
      await Promise.resolve();

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId,
          responseValue: value,
        })
      );
    });
  });

  describe('handleMultiselectChange', () => {
    test('should debounce save for 2000ms', () => {
      const questionId = 'q2';
      const validOptions = ['Option 1', 'Option 2', 'Option 3'];

      service.handleMultiselectChange(questionId, 'Option 1', true, validOptions);

      // Should not have saved yet
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).not.toHaveBeenCalled();

      // Fast-forward 1999ms - should still not save
      jest.advanceTimersByTime(1999);
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).not.toHaveBeenCalled();

      // Fast-forward 1ms more (total 2000ms) - should save
      jest.advanceTimersByTime(1);
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).toHaveBeenCalled();
    });

    test('should add option when checked', () => {
      const questionId = 'q2';
      const validOptions = ['Option 1', 'Option 2', 'Option 3'];

      service.handleMultiselectChange(questionId, 'Option 1', true, validOptions);
      service.handleMultiselectChange(questionId, 'Option 2', true, validOptions);

      const pendingValues = service.getPendingMultiselectValues(questionId);
      expect(pendingValues).toEqual(['Option 1', 'Option 2']);
    });

    test('should remove option when unchecked', () => {
      const questionId = 'q2';
      const validOptions = ['Option 1', 'Option 2', 'Option 3'];

      service.handleMultiselectChange(questionId, 'Option 1', true, validOptions);
      service.handleMultiselectChange(questionId, 'Option 2', true, validOptions);
      service.handleMultiselectChange(questionId, 'Option 1', false, validOptions);

      const pendingValues = service.getPendingMultiselectValues(questionId);
      expect(pendingValues).toEqual(['Option 2']);
    });

    test('should filter invalid options from existing response', () => {
      const questionId = 'q2';
      const validOptions = ['Option 1', 'Option 2'];

      // Set up existing response with invalid option
      global.POWERPOD.workbookQuestionsAndResponses.questionsWithResponses.set(questionId, {
        question: { id: questionId },
        response: {
          quartech_response: 'Option 1;Invalid Option;Option 2',
        },
      });

      service.handleMultiselectChange(questionId, 'Option 1', false, validOptions);

      const pendingValues = service.getPendingMultiselectValues(questionId);
      // Should only have Option 2 (Option 1 unchecked, Invalid Option filtered)
      expect(pendingValues).toEqual(['Option 2']);
    });
  });

  describe('handleMultilineTextInput', () => {
    test('should debounce save for 2000ms', () => {
      const questionId = 'q3';
      const value = 'Test multiline text';

      service.handleMultilineTextInput(questionId, value);

      // Should not have saved yet
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).not.toHaveBeenCalled();

      // Fast-forward 1999ms - should still not save
      jest.advanceTimersByTime(1999);
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).not.toHaveBeenCalled();

      // Fast-forward 1ms more (total 2000ms) - should save
      jest.advanceTimersByTime(1);
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).toHaveBeenCalled();
    });

    test('should emit status change events', () => {
      const questionId = 'q3';
      const value = 'Test text';
      const eventHandler = jest.fn();

      service.on('multiline-text-status-changed', eventHandler);
      service.handleMultilineTextInput(questionId, value);

      // Should emit draft status immediately
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          questionId,
          status: 'draft',
          charCount: value.length,
        })
      );
    });

    test('should update character count immediately', () => {
      const questionId = 'q3';
      const value = 'Test text with 25 chars';
      const eventHandler = jest.fn();

      service.on('multiline-text-status-changed', eventHandler);
      service.handleMultilineTextInput(questionId, value);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          charCount: 25,
        })
      );
    });
  });

  describe('forceSaveMultilineText', () => {
    test('should save immediately without debounce', async () => {
      const questionId = 'q3';
      const value = 'Test text';

      // Set up pending value
      service.handleMultilineTextInput(questionId, value);

      // Clear the mock to check force save call
      jest.clearAllMocks();

      // Force save
      await service.forceSaveMultilineText(questionId);

      // Should have saved immediately
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).toHaveBeenCalled();
    });

    test('should clear debounce timer', async () => {
      const questionId = 'q3';
      const value = 'Test text';

      // Set up pending value with debounce
      service.handleMultilineTextInput(questionId, value);

      // Force save before debounce completes
      await service.forceSaveMultilineText(questionId);

      // Fast-forward past debounce time
      jest.advanceTimersByTime(2000);

      // Should only have saved once (from force save, not from debounce)
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    test('should clear all debounce timers', () => {
      service.handleRatingChange('q1', '1');
      service.handleMultiselectChange('q2', 'Option 1', true, ['Option 1']);
      service.handleMultilineTextInput('q3', 'Text');

      service.cleanup();

      // Fast-forward past all debounce times
      jest.advanceTimersByTime(3000);

      // Should not have saved anything (timers were cleared)
      expect(global.POWERPOD.fetch.patchWorkbookResponseData).not.toHaveBeenCalled();
    });

    test('should clear all pending values', () => {
      service.handleRatingChange('q1', '1');
      service.handleMultiselectChange('q2', 'Option 1', true, ['Option 1']);

      service.cleanup();

      expect(service.getPendingResponseValue('q1')).toBeUndefined();
      expect(service.getPendingMultiselectValues('q2')).toBeUndefined();
    });
  });
});


