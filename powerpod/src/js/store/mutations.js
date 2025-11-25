import {
  displayActiveFieldErrors,
  displayValidationErrors,
} from '../common/fieldValidation.js';
import { hideQuestion, showFieldRow } from '../common/html.js';
import { Logger } from '../common/logger.js';

const logger = Logger('store/mutations');

export default {
  setFieldData(state, payload) {
    logger.info({
      fn: this.setFieldData,
      message: 'Updated field config in state',
      data: { state, payload },
    });
    state.fields = payload.fields;
    return state;
  },
  addFieldData(state, payload) {
    logger.info({
      fn: this.addFieldData,
      message: 'Add field data to state',
      data: { state, payload },
    });
    let fieldData;
    if (state.fields[payload.name]) {
      fieldData = state.fields[payload.name];
    }

    fieldData = {
      ...fieldData,
      ...payload,
    };

    state.fields[payload.name] = fieldData;
    return state;
  },
  setQuestionnaireData(state, payload) {
    logger.info({
      fn: this.setQuestionnaireData,
      message: 'Updated questionnaire data in state',
      data: { state, payload },
    });
    state.questionnaire = payload.questionnaire;
    return state;
  },
  updateQuestionnaireChapter(state, payload) {
    logger.info({
      fn: this.updateQuestionnaireChapter,
      message: 'Update questionnaire chapter in state',
      data: { state, payload },
    });

    if (!state.questionnaire.chapters) {
      state.questionnaire.chapters = [];
    }

    // Find and update the chapter in the nested structure
    const updateChapterInArray = (chapters, chapterId, updateData) => {
      for (let i = 0; i < chapters.length; i++) {
        const chapterGroup = chapters[i];
        if (Array.isArray(chapterGroup)) {
          // Handle nested array structure
          for (let j = 0; j < chapterGroup.length; j++) {
            const chapter = chapterGroup[j];
            if (chapter.id === chapterId) {
              chapters[i][j] = { ...chapter, ...updateData };
              return true;
            }
            // Check subchapters
            if (chapter.subchapters) {
              if (updateChapterInArray([chapter.subchapters], chapterId, updateData)) {
                return true;
              }
            }
          }
        }
      }
      return false;
    };

    updateChapterInArray(state.questionnaire.chapters, payload.chapterId, payload.updateData);
    return state;
  },
  updateQuestionnaireQuestion(state, payload) {
    logger.info({
      fn: this.updateQuestionnaireQuestion,
      message: 'Update questionnaire question in state',
      data: { state, payload },
    });

    if (!state.questionnaire.chapters) {
      return state;
    }

    // Find and update the question in the nested structure
    const updateQuestionInChapters = (chapters, questionId, updateData) => {
      for (const chapterGroup of chapters) {
        if (Array.isArray(chapterGroup)) {
          for (const chapter of chapterGroup) {
            // Check questions in main chapter
            if (chapter.questions) {
              const questionIndex = chapter.questions.findIndex(q => q.id === questionId);
              if (questionIndex !== -1) {
                chapter.questions[questionIndex] = { ...chapter.questions[questionIndex], ...updateData };
                return true;
              }
            }
            // Check questions in subchapters
            if (chapter.subchapters) {
              if (updateQuestionInChapters([chapter.subchapters], questionId, updateData)) {
                return true;
              }
            }
          }
        }
      }
      return false;
    };

    updateQuestionInChapters(state.questionnaire.chapters, payload.questionId, payload.updateData);
    return state;
  },
  setValidationError(state, payload) {
    if (state.validationError === payload) {
      logger.warn({
        fn: this.setValidationError,
        message:
          'Previous validationError state matches payload, no need to update',
        data: { state, payload },
      });
      return state;
    }
    state.validationError = payload;
    displayValidationErrors(state.validationError);
    return state;
  },
  addValidationError(state, payload) {
    if (state.validationError.includes(payload)) {
      logger.warn({
        fn: this.addValidationError,
        message:
          'Added validationError message already included in currently displayed message',
        data: { state, payload },
      });
      return state;
    }
    const currentState = state.validationError;
    state.validationError = currentState.concat(payload);
    displayValidationErrors(state.validationError);
    return state;
  },
  removeValidationError(state, payload) {
    if (!state.validationError.includes(payload)) {
      logger.error({
        fn: this.addValidationError,
        message:
          'Requested validationError paylaod does not exist in current state',
        data: { state, payload },
      });
      return state;
    }
    const currentState = state.validationError;
    state.validationError = currentState.replace(payload, '');
    displayValidationErrors(state.validationError);
    return state;
  },
  addToFieldOrder(state, payload) {
    logger.info({
      fn: this.addToFieldOrder,
      message: 'Add field to fieldOrder array',
      data: { state, payload },
    });
    const newFieldOrder = state.fieldOrder;
    newFieldOrder.push(payload);
    state.fieldOrder = newFieldOrder;
    return state;
  },
  setPortalPageData(state, payload) {
    logger.info({
      fn: this.setPortalPageData,
      message: 'Set portal page data in state',
      data: { state, payload },
    });
    if (!state.portalPages) {
      state.portalPages = {};
    }
    state.portalPages[payload.name] = payload.data;
    return state;
  },
  setUserRoles(state, payload) {
    logger.info({
      fn: this.setUserRoles,
      message: 'Set user roles in state',
      data: { state, payload },
    });
    state.userRoles = payload.roles;
    return state;
  },
};
