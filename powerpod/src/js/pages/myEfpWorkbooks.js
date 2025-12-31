import { Logger } from '../common/logger.js';
import { MaskTypeFormat } from '../common/masking.js';
import { Scripts, useScript } from '../common/scripts.js';

const logger = Logger('pages/myEfpWorkbooks');

const EFP_ID_FIELD_NAME = 'quartech_iafid';
const MODAL_IFRAME_SELECTOR = '.modal-form iframe';
const POLL_INTERVAL_MS = 500;
const MAX_POLL_ATTEMPTS = 120; // 60 seconds max

// Track if mask has been applied to avoid duplicates
let maskApplied = false;

export function initMyEfpWorkbooks() {
  logger.info({
    fn: initMyEfpWorkbooks,
    message: 'initializing My EFP Workbooks page',
  });

  // Reset state in case of re-initialization
  maskApplied = false;

  // Start watching for the modal iframe
  watchForModalIframe();
}

/**
 * Finds the EFP ID field, checking both the main document and any modal iframes
 * @returns {HTMLInputElement | null}
 */
function findEfpIdField() {
  // First check the main document
  const mainDocField = document.getElementById(EFP_ID_FIELD_NAME);
  if (mainDocField) {
    return /** @type {HTMLInputElement} */ (mainDocField);
  }

  // Check inside modal iframes
  const iframes = document.querySelectorAll(MODAL_IFRAME_SELECTOR);
  for (const iframe of iframes) {
    try {
      const iframeEl = /** @type {HTMLIFrameElement} */ (iframe);
      const iframeDoc = iframeEl.contentDocument || iframeEl.contentWindow?.document;
      if (iframeDoc) {
        const field = iframeDoc.getElementById(EFP_ID_FIELD_NAME);
        if (field) {
          return /** @type {HTMLInputElement} */ (field);
        }
      }
    } catch (e) {
      // Cross-origin iframe, skip it
      logger.info({
        fn: findEfpIdField,
        message: 'Could not access iframe content (likely cross-origin)',
      });
    }
  }

  return null;
}

/**
 * Applies the EFP ID mask directly to a field element (works for iframe fields)
 * @param {HTMLInputElement} field
 */
function applyMaskToField(field) {
  // Add placeholder to show expected format
  field.placeholder = MaskTypeFormat.EfpId;

  // Prefill "EFP-" when the field is focused and empty
  field.addEventListener('focus', function() {
    if (!field.value || field.value.trim() === '') {
      field.value = 'EFP-';
      // Position cursor at the end
      setTimeout(() => {
        field.setSelectionRange(field.value.length, field.value.length);
      }, 0);
    }
  });

  // Add placeholder styling to the iframe's document
  const fieldDoc = field.ownerDocument;
  if (fieldDoc && !fieldDoc.getElementById('efp-id-placeholder-style')) {
    const style = fieldDoc.createElement('style');
    style.id = 'efp-id-placeholder-style';
    style.textContent = `
      #${EFP_ID_FIELD_NAME}::placeholder {
        color: #999 !important;
        opacity: 1 !important;
      }
      #${EFP_ID_FIELD_NAME}::-webkit-input-placeholder {
        color: #999 !important;
        opacity: 1 !important;
      }
      #${EFP_ID_FIELD_NAME}::-moz-placeholder {
        color: #999 !important;
        opacity: 1 !important;
      }
      #${EFP_ID_FIELD_NAME}:-ms-input-placeholder {
        color: #999 !important;
        opacity: 1 !important;
      }
    `;
    fieldDoc.head.appendChild(style);
  }

  useScript(Scripts.jquerymask, function() {
    // Use the main window's jQuery since that's where the mask plugin is loaded
    // jQuery can still manipulate DOM elements from iframes
    // @ts-ignore
    const $ = window.$ || window.jQuery;

    if ($ && typeof $.fn.mask === 'function') {
      $(field).mask(MaskTypeFormat.EfpId);
      logger.info({
        fn: applyMaskToField,
        message: 'Successfully applied EFP ID mask to field',
      });
    } else {
      logger.error({
        fn: applyMaskToField,
        message: 'jQuery or mask plugin not available',
      });
    }
  });
}

/**
 * Uses polling to watch for the modal iframe and the field inside it
 */
function watchForModalIframe() {
  logger.info({
    fn: watchForModalIframe,
    message: 'Setting up polling to watch for modal iframe with EFP ID field',
  });

  let pollAttempts = 0;
  /** @type {ReturnType<typeof setInterval> | null} */
  let intervalId = null;

  // Cleanup function
  const cleanup = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    logger.info({
      fn: watchForModalIframe,
      message: 'Polling stopped',
    });
  };

  // Polling to check for the field
  intervalId = setInterval(() => {
    pollAttempts++;

    if (maskApplied) {
      cleanup();
      return;
    }

    const field = findEfpIdField();
    if (field) {
      logger.info({
        fn: watchForModalIframe,
        message: 'EFP ID field found, applying mask',
      });
      applyMaskToField(field);
      maskApplied = true;
      cleanup();
      return;
    }

    // Stop polling after max attempts
    if (pollAttempts >= MAX_POLL_ATTEMPTS) {
      logger.warn({
        fn: watchForModalIframe,
        message: `Stopped polling after ${MAX_POLL_ATTEMPTS} attempts - field not found`,
      });
      cleanup();
    }
  }, POLL_INTERVAL_MS);

  logger.info({
    fn: watchForModalIframe,
    message: `Polling started (every ${POLL_INTERVAL_MS}ms, max ${MAX_POLL_ATTEMPTS} attempts)`,
  });
}

