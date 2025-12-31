import { Logger } from '../common/logger.js';
import { maskInput, FieldMaskType } from '../common/masking.js';

const logger = Logger('pages/myEfpWorkbooks');

const EFP_ID_FIELD_NAME = 'quartech_iafid';

export function initMyEfpWorkbooks() {
  logger.info({
    fn: initMyEfpWorkbooks,
    message: 'initializing My EFP Workbooks page',
  });

  // Wait for DOM to be ready, then apply the EFP ID mask
  applyEfpIdMask();
}

function applyEfpIdMask() {
  // Check if the field exists
  const efpIdField = document.getElementById(EFP_ID_FIELD_NAME);
  
  if (efpIdField) {
    logger.info({
      fn: applyEfpIdMask,
      message: `Found EFP ID field, applying mask`,
    });
    maskInput(EFP_ID_FIELD_NAME, FieldMaskType.EfpId);
  } else {
    logger.info({
      fn: applyEfpIdMask,
      message: `EFP ID field not found on page, skipping mask`,
    });
  }
}

