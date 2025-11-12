import { POWERPOD } from './constants.js';
import { getContactData } from '../common/fetch.js';
import { Logger } from './logger.js';

const logger = Logger('common/contacts');

// @ts-ignore
POWERPOD.contacts = {
  getContactName,
  isContactProducer,
  isContactPA,
};

/**
 * @param {string} contactId
 */
export async function getContactName(contactId) {
  const { data } = await getContactData({ contactId });

  if (!data || !data.value?.length) {
    logger.error({
      fn: getContactName,
      message: 'Failed to get contact',
    });
    return;
  }

  const { fullname } = data.value?.[0].fullname;

  if (!fullname || !fullname.length) {
    logger.error({
      fn: getContactName,
      message: 'Failed to get contact name',
    });
    return;
  }

  logger.info({
    fn: getContactName,
    message: `Successfully retrieved fullname: ${fullname}`,
  });

  return fullname;
}

/**
 * @param {any} contactId
 */
export async function isContactProducer(contactId) {
  var isProducer = false;
  const { data } = await getContactData({ contactId });

  if (!data || !data.value?.length) {
    logger.error({
      fn: getContactName,
      message: 'Failed to get contact',
    });
    return;
  }

  const { userRoles } = data.value?.[0].userRoles;

  if (userRoles.contains("EFP Producer")){
    isProducer = true;
  }

  return isProducer;
}

/**
 * @param {any} contactId
 */
export async function isContactPA(contactId) {
  var isPA = false;
  const { data } = await getContactData({ contactId });

  if (!data || !data.value?.length) {
    logger.error({
      fn: getContactName,
      message: 'Failed to get contact',
    });
    return;
  }

  const { userRoles } = data.value?.[0].userRoles;

  if (userRoles.contains("EFP Planning Advisor")){
    isPA = true;
  }

  return isPA;
}