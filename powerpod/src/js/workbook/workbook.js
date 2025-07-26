import { Logger } from '../common/logger.js';
import { preloadRequestVerificationToken } from '../common/dynamics.ts';

const logger = Logger('workbook/workbook');

export function initWorkbook() {
  preloadRequestVerificationToken();
  logger.info({
    fn: initWorkbook,
    message: `workbook initialized!`
  })
}
