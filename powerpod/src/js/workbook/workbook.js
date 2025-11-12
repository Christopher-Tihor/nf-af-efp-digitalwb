import { Logger } from '../common/logger.js';
import { getCurrentUser, preloadRequestVerificationToken } from '../common/dynamics.ts';
import { hideLoadingAnimation } from '../common/loading.js';
import {
  getWorkbookId,
  loadWorkbookData,
  isWorkbookInitialized,
} from '../common/workbookUtils.js';
import {
  loadChaptersAndQuestions,
  getChaptersWithNestedQuestionsAndSubchapters,
} from '../common/chaptersAndQuestionsUtils.js';
import { loadQuestionnaireWithResponses } from '../common/questionnaire.js';
import { POWERPOD } from '../common/constants.js';
import '../common/workbookResponseHelper.js';
import '../components/EFPEntryForm.ts';
import { loadTermsAndConditions } from '../common/declarationAndConsentUtils.js';
import { getContactName } from '../common/contacts.js';

const logger = Logger('workbook/workbook');

function updateEFPEntryFormWithNestedStructure(nestedStructure) {
  try {
    // Find the EFP Entry Form component in the DOM
    const efpEntryForm = document.querySelector('efp-entry-form');

    if (!efpEntryForm) {
      logger.warn({
        // @ts-ignore
        fn: updateEFPEntryFormWithNestedStructure,
        message: 'EFP Entry Form component not found in DOM',
      });
      return;
    }

    // @ts-ignore
    if (typeof efpEntryForm.updateNestedChapterStructure === 'function') {
      // @ts-ignore
      efpEntryForm.updateNestedChapterStructure(nestedStructure);
      logger.info({
        // @ts-ignore
        fn: updateEFPEntryFormWithNestedStructure,
        message:
          'Successfully updated EFP Entry Form with nested chapter structure',
        data: {
          chaptersCount: nestedStructure.length,
        },
      });
    } else {
      logger.warn({
        // @ts-ignore
        fn: updateEFPEntryFormWithNestedStructure,
        message:
          'EFP Entry Form component does not support updateNestedChapterStructure method',
      });

      // Try alternative approach - set property directly
      // @ts-ignore
      if (efpEntryForm.nestedChapterStructure !== undefined) {
        // @ts-ignore
        efpEntryForm.nestedChapterStructure = nestedStructure;
        // @ts-ignore
        efpEntryForm.requestUpdate();
        logger.info({
          // @ts-ignore
          fn: updateEFPEntryFormWithNestedStructure,
          message: 'Updated EFP Entry Form via direct property assignment',
        });
      }
    }
  } catch (error) {
    logger.error({
      // @ts-ignore
      fn: updateEFPEntryFormWithNestedStructure,
      message: 'Failed to update EFP Entry Form with nested structure',
      data: { error },
    });
  }
}

export async function initWorkbook() {
  // Prevent multiple initializations
  if (isWorkbookInitialized()) {
    logger.info({
      fn: initWorkbook,
      message: 'Workbook already initialized, skipping...',
    });
    return;
  }

  // Check if token already exists to avoid redundant calls
  const existingToken = document.querySelector(
    'input[name=__RequestVerificationToken]'
  );
  if (!existingToken) {
    await preloadRequestVerificationToken();
  }

  logger.info({
    fn: initWorkbook,
    message: `workbook initialized!`,
  });

  // Get workbook ID and load data
  const workbookId = getWorkbookId();
  if (workbookId) {
    await loadWorkbookData(workbookId);
  } else {
    // Mark as initialized even if no workbook ID was found
    // @ts-ignore
    POWERPOD.workbook = { initialized: true };
  }

  // Insert the LitElement first
  insertLitElement();

  // Load terms and conditions data
  await loadTermsAndConditions();

  // Load chapters and workbook questions data
  await loadChaptersAndQuestions();

  const { contactId } = getCurrentUser();
  if(contactId != null){
    const fullname = await getContactName(contactId);
  }

  // Build and store the nested chapter structure
  try {
    logger.info({
      fn: initWorkbook,
      message: 'Building nested chapter structure...',
    });

    const nestedStructure = getChaptersWithNestedQuestionsAndSubchapters();

    logger.info({
      fn: initWorkbook,
      message: 'Successfully built nested chapter structure',
      data: {
        chaptersCount: nestedStructure.length,
        totalSubchapters: nestedStructure.reduce(
          (sum, chapter) => sum + chapter.subchapters.length,
          0
        ),
        totalQuestions: nestedStructure.reduce(
          (sum, chapter) =>
            sum +
            chapter.questions.length +
            chapter.subchapters.reduce(
              (subSum, subchapter) => subSum + subchapter.questions.length,
              0
            ),
          0
        ),
      },
    });

    // Store nested structure in POWERPOD object
    // @ts-ignore
    POWERPOD.workbook = POWERPOD.workbook || {};
    // @ts-ignore
    POWERPOD.workbook.nestedStructure = nestedStructure;

    // Load questionnaire data with responses into the store
    const workbookId = getWorkbookId();
    if (workbookId) {
      loadQuestionnaireWithResponses(nestedStructure, workbookId).catch(error => {
        logger.error({
          fn: initWorkbook,
          message: 'Failed to load questionnaire with responses, continuing without responses',
          data: { error: error.message }
        });
      });
    } else {
      logger.warn({
        fn: initWorkbook,
        message: 'No workbook ID available, loading questionnaire without responses'
      });
      // Import the basic function dynamically
      import('../common/questionnaire.js').then(({ loadQuestionnaireIntoStore }) => {
        loadQuestionnaireIntoStore(nestedStructure);
      });
    }

    // Update the EFP Entry Form component with the nested structure
    // Use multiple attempts to ensure the component gets updated
    updateEFPEntryFormWithNestedStructure(nestedStructure);

    // Retry after a short delay in case the component wasn't ready
    setTimeout(() => {
      updateEFPEntryFormWithNestedStructure(nestedStructure);
    }, 100);

    // Final retry after a longer delay
    setTimeout(() => {
      updateEFPEntryFormWithNestedStructure(nestedStructure);
    }, 500);
  } catch (error) {
    logger.error({
      fn: initWorkbook,
      message: 'Failed to build nested chapter structure',
      data: { error },
    });
  }

  hideLoadingAnimation();
}

// Function to insert the element
function insertLitElement() {
  const container = document.querySelector('.page-copy');
  if (container) {
    const element = document.createElement('efp-entry-form');
    container.appendChild(element);
  } else {
    console.warn('No element with class "page-copy" found.');
  }
}
