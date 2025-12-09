import { Form, POWERPOD } from './constants.js';
import { getRequestVerificationToken } from './dynamics.ts';
import { Logger } from './logger.js';

const logger = Logger('common/fetch');

export const ENDPOINT_URL = {
  get_env_vars_data:
    "/_api/environmentvariabledefinitions?$filter=contains(schemaname,'quartech_')&$select=schemaname,environmentvariabledefinitionid&$expand=environmentvariabledefinition_environmentvariablevalue($select=value)",
  get_application_form_data: (programId) =>
    `/_api/msgov_programs(${programId})?$select=msgov_programid, quartech_disabledchefsdemographicinfo, msgov_programname, quartech_applicantportalprogramname, quartech_applicantportalprogramstreamjsonconfig, quartech_portalapplicationpagetitle, quartech_portalapplicationpagesubtitle, quartech_portalapplicationpagedescription, quartech_programabbreviation, quartech_programemailaddress, quartech_portalappactivityinfohiddenfields, quartech_portalappprojectdeschiddenfields, quartech_portalappfieldsdisplaynamesmapping, quartech_typesofbusinesstodisplay, quartech_applicantportalapplicationformconfigjson, quartech_activitiestypestodisplay&$expand=quartech_ApplicantPortalConfig($select=quartech_name,quartech_configdata)`,
  get_claim_form_data: (programId) =>
    `/_api/msgov_programs(${programId})?$select=msgov_programid, msgov_programname, quartech_applicantportalprogramname, quartech_claimformheaderhtmlcontent, quartech_applicantportalclaimformjson, quartech_applicantportalprogramstreamjsonconfig, quartech_portalapplicationpagetitle, quartech_portalapplicationpagesubtitle, quartech_portalapplicationpagedescription, quartech_programabbreviation, quartech_programemailaddress, quartech_portalappactivityinfohiddenfields, quartech_portalappprojectdeschiddenfields, quartech_portalappfieldsdisplaynamesmapping, quartech_typesofbusinesstodisplay, quartech_applicantportalapplicationformconfigjson, quartech_expensetypestodisplay, quartech_activitiestypestodisplay&$expand=quartech_ApplicantPortalConfig($select=quartech_name,quartech_configdata)`,
  get_municipal_data:
    '/_api/quartech_municipals?$select=quartech_name,quartech_municipalid&$expand=quartech_RegionalDistrict($select=quartech_name,quartech_regionaldistrictid,_quartech_censusofagricultureregion_value)',
  get_expense_type_data: ' ',
  get_documents_data: (formId) =>
    `/_api/annotations?$filter=_objectid_value%20eq%20${formId}&$select=filename,filesize,modifiedon,subject,isdocument,objecttypecode,annotationid,mimetype`,
  get_document_data: (annotationId) =>
    `/_api/annotations?$filter=annotationid%20eq%20${annotationId}&$select=filename,filesize,modifiedon,subject,isdocument,objecttypecode,documentbody,annotationid`,
  post_document_data: `/_api/annotations`,
  delete_document_data: (annotationId) => `/_api/annotations(${annotationId})`,
  get_contact_data: (contactId) =>
    `/_api/contacts?$filter=contactid%20eq%20${contactId}&$select=fullname`,
  get_orgbook_autocomplete_data:
    'https://orgbook.gov.bc.ca/api/v3/search/autocomplete',
  get_orgbook_topic_data: 'https://orgbook.gov.bc.ca/api/v4/search/topic',
  get_orgbook_credentials_data: (topicId) =>
    `https://orgbook.gov.bc.ca/api/v4/topic/${topicId}/credential-set`,
  patch_quartech_claim_data: (id) => `/_api/quartech_claims(${id})`,
  get_claim_data: (id) => `/_api/quartech_claims(${id})`,
  patch_application_data: (id) =>
    `/_api/msgov_businessgrantapplications(${id})`,
  get_application_data: (id) =>
    `/_api/msgov_businessgrantapplications?$filter=msgov_businessgrantapplicationid%20eq%20${id}`,
  get_draft_applications_for_programid_data: (programid) =>
    `/_api/msgov_businessgrantapplications?$filter=_quartech_program_value%20eq%20${programid}%20and%20quartech_applicationstatus%20eq%20255550002%20and%20statuscode%20eq%201&$select=msgov_businessgrantapplicationid,_quartech_program_value,quartech_applicationstatus,statuscode`,
  post_application_data: '/_api/msgov_businessgrantapplications',
  get_demographic_info_data: (demographicInfoId) =>
    `/_api/quartech_demographicinfos(${demographicInfoId})`,
  patch_demographic_info_data: (demographicInfoId) =>
    `/_api/quartech_demographicinfos(${demographicInfoId})`,
  post_browserinformation_data: '/_api/quartech_browserinformations',
  get_types_of_food_data: `/_api/quartech_typeoffoods?$select=quartech_name`,
  get_commodities_data: `/_api/quartech_commodities?$select=quartech_name,_quartech_naicscode_value,quartech_category`,
  get_program_intake_data: `/_api/quartech_programintakes?$select=quartech_intakeenddate,quartech_intakestartdate,quartech_openintakedescription,quartech_closedintakedescription`,
  get_program_home_page_content_data: `/_api/quartech_programhomepagecontents`,
  get_workbook_data_by_id: (id) => `/_api/quartech_workbooks(${id})`,
  patch_workbook_data: (id) => `/_api/quartech_workbooks(${id})`,
  get_chapters_data: `/_api/quartech_chapters?$filter=statecode eq 0`,
  get_workbookquestions_data: `/_api/quartech_workbookquestions?$filter=statecode eq 0`,
  get_workbookresponses_data: `/_api/quartech_workbookresponses?$filter=statecode eq 0`,
  get_workbookresponses_by_workbook: (workbookId) =>
    `/_api/quartech_workbooks(${workbookId})?$expand=quartech_workbookresponse_Workbook_quartech_workbook($filter=statecode eq 0)`,
  get_workbookresponses_by_workbook_and_question: (workbookId, questionId) =>
    `/_api/quartech_workbooks(${workbookId})?$expand=quartech_workbookresponse_Workbook_quartech_workbook($filter=_quartech_question_value eq ${questionId} and statecode eq 0;$select=quartech_workbookresponseid,quartech_response,createdon,modifiedon,_quartech_question_value;$expand=quartech_Question($select=quartech_questiontext,quartech_questiontype);$orderby=createdon desc)`,
  // Direct query to workbook responses collection - simpler and more reliable
  get_workbookresponses_direct: (workbookId, questionId) =>
    `/_api/quartech_workbookresponses?$filter=_quartech_workbook_value eq ${workbookId} and _quartech_question_value eq ${questionId} and statecode eq 0&$orderby=createdon desc&$top=1`,
  post_workbookresponse_data: `/_api/quartech_workbookresponses`,
  patch_workbookresponse_data: (id) => `/_api/quartech_workbookresponses(${id})`,
  delete_workbookresponse_data: (id) => `/_api/quartech_workbookresponses(${id})`,
  get_portal_page_data: (params = '') => `/_api/quartech_portalpages${params ? `?${params}` : ''}`,
  get_actionplans_data: `/_api/quartech_actionplans?$filter=statecode eq 0`,
  post_actionplan_data: `/_api/quartech_actionplans`,
  patch_actionplan_data: (id) => `/_api/quartech_actionplans(${id})`,
  delete_actionplan_data: (id) => `/_api/quartech_actionplans(${id})`,
};

const CONTENT_TYPE = {
  json: 'application/json; charset=utf-8',
};

const DATATYPE = {
  json: 'json',
};

POWERPOD.fetch = {
  fetch,
  CACHED_RESULTS: {},
  ENDPOINT_URL,
  CONTENT_TYPE,
  DATATYPE,
  getEnvVarsData,
  getApplicationFormData,
  getClaimFormData,
  getMunicipalData,
  getExpenseTypeData,
  getOrgbookAutocompleteData,
  getOrgbookTopicData,
  getOrgbookCredentialsData,
  getDocumentsData,
  getDocumentData,
  postDocumentData,
  deleteDocumentData,
  getContactData,
  patchClaimData,
  getApplicationData,
  getDraftApplicationsForProgramIdData,
  postApplicationData,
  getDemographicInfoData,
  patchDemographicInfoData,
  postBrowserInformationData,
  getTypesOfFoodData,
  getCommoditiesData,
  getClaimData,
  getProgramIntakeData,
  getProgramHomePageContentData,
  getWorkbookDataById,
  patchWorkbookData,
  getChaptersData,
  getWorkbookQuestionsData,
  getWorkbookResponsesData,
  getWorkbookResponsesByWorkbook,
  getWorkbookResponsesByWorkbookAndQuestion,
  postWorkbookResponseData,
  patchWorkbookResponseData,
  deleteWorkbookResponseData,
  getPortalPageData,
  getActionPlansData,
  postActionPlanData,
  patchActionPlanData,
  deleteActionPlanData,
};

const setODataHeaders = (XMLHttpRequest) => {
  XMLHttpRequest.setRequestHeader('Accept', 'application/json');
  XMLHttpRequest.setRequestHeader('OData-MaxVersion', '4.0');
  XMLHttpRequest.setRequestHeader('OData-Version', '4.0');
  XMLHttpRequest.setRequestHeader('Prefer', 'odata.include-annotations="*"');
};

const setReqVerificationHeaderToken = (XMLHttpRequest) => {
  const requestVerificationToken = getRequestVerificationToken();
  if (!requestVerificationToken) {
    logger.warn({
      fn: setReqVerificationHeaderToken,
      message: 'Failed to set request verification token header',
    });
  }
  XMLHttpRequest.setRequestHeader(
    '__RequestVerificationToken',
    requestVerificationToken
  );
  logger.info({
    fn: setReqVerificationHeaderToken,
    message: `Successfully set header __RequestVerificationToken=${requestVerificationToken}`,
  });
};

// Note: Cross-domain requests and dataType: "jsonp" requests do not support synchronous operation
// async: false with jqXHR ($.Deferred) is deprecated; you must use the success/error/complete
// callback options instead of the corresponding methods of the jqXHR object such as jqXHR.done().

// TODO: cleanup usage of ".done()" deprecated method in project, functions still using:
// e.g. "getTopic" & "getTopicCredentials" in src/js/application/steps/applicantInfo.js
export async function fetch(params) {
  const {
    method = 'GET',
    url: endpointUrl,
    beforeSend,
    onSuccess,
    onError,
    async = true,
    data = {},
    processData = true, // whether to automatically convert data obj to application/x-www-form-urlencoded
    datatype, // request data type
    contentType, // expected response content type
    includeODataHeaders = false,
    skipCache = false,
    returnData = false, // return the data directly, skips having to pass onSuccess handler
    addRequestVerificationToken = false, // needed for post reqs
    timeout = 60 * 1000, // default to 60 second timeout
  } = params;
  // check cache if used
  const paramsToHash = params;
  delete paramsToHash.skipCache;
  const reqHash = JSON.stringify(paramsToHash);
  let url = endpointUrl;
  if (window.location.hostname === 'localhost') {
    url = 'https://af-pods-dev.powerappsportals.com' + endpointUrl;
  }
  logger.info({
    fn: fetch,
    message: 'Starting fetch request...',
    data: { ...params, fetch: POWERPOD.fetch, url },
  });
  // caching is only supported for GET requests
  if (
    method === 'GET' &&
    !skipCache &&
    POWERPOD.fetch.CACHED_RESULTS[reqHash]
  ) {
    const { data, textStatus, jqXHR } = POWERPOD.fetch.CACHED_RESULTS[reqHash];
    logger.info({
      fn: fetch,
      message: `returning cached data for url: ${url}`,
      data: {
        data,
        params,
      },
    });
    if (returnData) {
      return Promise.resolve({
        data,
        textStatus,
        jqXHR,
      });
    }
    return Promise.resolve(onSuccess(data, textStatus, jqXHR));
  }
  // @ts-ignore
  return $.ajax({
    method,
    url,
    contentType,
    datatype,
    data,
    processData,
    async,
    timeout,
    beforeSend: function (XMLHttpRequest) {
      if (addRequestVerificationToken) {
        setReqVerificationHeaderToken(XMLHttpRequest);
      }
      if (includeODataHeaders) setODataHeaders(XMLHttpRequest);
      if (beforeSend && typeof beforeSend === 'function') beforeSend(XMLHttpRequest);
    },
    success: function (data, textStatus, jqXHR) {
      logger.info({
        fn: fetch,
        message: 'success handler called',
        data: {
          data,
          params,
        },
      });
      // always cache data
      POWERPOD.fetch.CACHED_RESULTS[reqHash] = { data, textStatus, jqXHR };

      if (returnData) {
        logger.info({
          fn: fetch,
          message: `skipping onSuccess handler call: ${url}`,
          data: {
            data,
            params,
          },
        });
        return;
      }
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(data, textStatus, jqXHR);
      }
    },
    error: function (jqXHR, textStatus, errorThrown) {
      logger.error({
        fn: fetch,
        message: `Error handler called for url: ${url}`,
        data: { jqXHR, textStatus, errorThrown },
      });
      if (onError && typeof onError === 'function') {
        onError(jqXHR, textStatus, errorThrown);
      }
    },
  }).then((data, textStatus, jqXHR) => {
    if (returnData) {
      logger.info({
        fn: fetch,
        message: `returning data for url: ${url}`,
        data: {
          data,
          textStatus,
          jqXHR,
          params,
        },
      });
      return Promise.resolve({ data, textStatus, jqXHR });
    }
  });
}

export async function getEnvVarsData({ ...options } = {}) {
  return fetch({
    url: ENDPOINT_URL.get_env_vars_data,
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    async: false,
    returnData: true,
    ...options,
  });
}

export async function getApplicationFormData({
  programId,
  beforeSend,
  onSuccess,
  ...options
}) {
  return fetch({
    url: ENDPOINT_URL.get_application_form_data(programId),
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    async: false,
    beforeSend,
    onSuccess,
    ...options,
  });
}

export async function getClaimFormData({
  programId,
  beforeSend,
  onSuccess,
  ...options
}) {
  if (!programId) {
    logger.error({
      fn: getClaimFormData,
      message: 'Missing required params',
      data: {
        programId,
      },
    });
    return;
  }
  return fetch({
    url: ENDPOINT_URL.get_claim_form_data(programId),
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    async: false,
    beforeSend,
    onSuccess,
    ...options,
  });
}

export async function getMunicipalData({ onSuccess = null, ...options }) {
  return fetch({
    url: ENDPOINT_URL.get_municipal_data,
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    async: false,
    onSuccess,
    ...options,
  });
}

export async function getExpenseTypeData({ ...options } = {}) {
  return fetch({
    url: ENDPOINT_URL.get_expense_type_data,
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    async: false,
    returnData: true,
    ...options,
  });
}

export async function getOrgbookAutocompleteData({
  searchStr,
  onSuccess,
  ...options
}) {
  return fetch({
    url: ENDPOINT_URL.get_orgbook_autocomplete_data,
    data: { q: searchStr, inactive: 'false', revoked: 'false', latest: 'true' },
    onSuccess,
    ...options,
  });
}

export async function getOrgbookTopicData({ topicSourceId, ...options }) {
  return fetch({
    url: ENDPOINT_URL.get_orgbook_topic_data,
    data: { q: topicSourceId },
    ...options,
  });
}

export async function getOrgbookCredentialsData({ topicId, ...options }) {
  return fetch({
    url: ENDPOINT_URL.get_orgbook_credentials_data(topicId),
    ...options,
  });
}

export async function getDocumentsData({ formId, ...options }) {
  return fetch({
    url: ENDPOINT_URL.get_documents_data(formId),
    returnData: true,
    skipCache: true,
    ...options,
  });
}

export async function getDocumentData({ annotationId, ...options }) {
  return fetch({
    url: ENDPOINT_URL.get_document_data(annotationId),
    returnData: true,
    ...options,
  });
}

export async function postDocumentData({
  formId,
  subject,
  filename,
  documentbody,
  mimetype,
  formType,
  ...options
}) {
  logger.info({
    fn: postDocumentData,
    message: `postDocumentData called with payload:`,
    data: {
      formId,
      subject,
      filename,
      mimetype,
      formType,
      ...options,
    },
  });
  let objecttypecode,
    objecttypecode_databind = {};
  switch (formType) {
    case Form.Claim:
      objecttypecode = 'quartech_claim';
      objecttypecode_databind = {
        'objectid_quartech_claim@odata.bind': `/quartech_claims(${formId})`,
      };
      break;
    case Form.Application:
      objecttypecode = 'msgov_businessgrantapplication';
      objecttypecode_databind = {
        'objectid_msgov_businessgrantapplication@odata.bind': `/msgov_businessgrantapplications(${formId})`,
      };
      break;
  }
  logger.info({
    fn: postDocumentData,
    message: `postDocumentData called with objecttypecode: ${objecttypecode}, objecttypecode_databind: ${JSON.stringify(
      objecttypecode_databind
    )}`,
    data: {
      formId,
      subject,
      filename,
      mimetype,
      formType,
      ...options,
    },
  });
  return fetch({
    method: 'POST',
    url: ENDPOINT_URL.post_document_data,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    addRequestVerificationToken: true,
    processData: false,
    returnData: true,
    data: JSON.stringify({
      subject,
      filename,
      objecttypecode,
      ...objecttypecode_databind,
      documentbody,
      mimetype,
    }),
    ...options,
  });
}

export async function deleteDocumentData({ annotationId, ...options }) {
  return fetch({
    method: 'DELETE',
    url: ENDPOINT_URL.delete_document_data(annotationId),
    addRequestVerificationToken: true,
    returnData: true,
    ...options,
  });
}

export async function getContactData({ contactId, ...options }) {
  return fetch({
    url: ENDPOINT_URL.get_contact_data(contactId),
    returnData: true,
    ...options,
  });
}

export async function patchClaimData({ id, fieldData, ...options }) {
  return fetch({
    method: 'PATCH',
    url: ENDPOINT_URL.patch_quartech_claim_data(id),
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    addRequestVerificationToken: true,
    processData: false,
    returnData: true,
    data: JSON.stringify({
      ...fieldData,
    }),
    ...options,
  });
}

export async function getApplicationData({ id, ...options }) {
  return fetch({
    url: ENDPOINT_URL.get_application_data(id),
    returnData: true,
    ...options,
  });
}

export async function getClaimData({ id, ...options }) {
  return fetch({
    url: ENDPOINT_URL.get_claim_data(id),
    returnData: true,
    ...options,
  });
}

export async function getDraftApplicationsForProgramIdData({
  programid,
  ...options
}) {
  return fetch({
    url: ENDPOINT_URL.get_draft_applications_for_programid_data(programid),
    returnData: true,
    ...options,
  });
}

export async function postApplicationData({
  id,
  programid,
  contactid,
  quartech_nocragstnumber = null,
  ...options
}) {
  return fetch({
    method: 'POST',
    url: ENDPOINT_URL.post_application_data,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    addRequestVerificationToken: true,
    processData: false,
    returnData: true,
    data: JSON.stringify({
      msgov_businessgrantapplicationid: `${id}`,
      'quartech_Program@odata.bind': `/msgov_programs(${programid})`,
      'quartech_Applicant@odata.bind': `/contacts(${contactid})`,
      quartech_originalsource: 255550002, // always set to "Portal" for Draft status
      ...(quartech_nocragstnumber != null && { quartech_nocragstnumber }),
    }),
    ...options,
  });
}

export async function postBrowserInformationData({
  claimId = null,
  applicationId = null,
  payload = '',
  action,
  type,
  contactId,
  ...options
}) {
  return fetch({
    method: 'POST',
    url: ENDPOINT_URL.post_browserinformation_data,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    addRequestVerificationToken: true,
    processData: false,
    returnData: true,
    data: JSON.stringify({
      quartech_name: 'POWERPOD',
      quartech_action: `${action}`,
      ...(claimId != null && {
        'quartech_ClaimId@odata.bind': `/quartech_claims(${claimId})`,
      }),
      ...(applicationId != null && {
        'quartech_ApplicationId@odata.bind': `/msgov_businessgrantapplications(${applicationId})`,
      }),
      quartech_type: type,
      quartech_userid: contactId,
      quartech_applicantbrowserinformation: payload,
    }),
    ...options,
  });
}

export async function patchApplicationData({ id, fieldData, ...options }) {
  return fetch({
    method: 'PATCH',
    url: ENDPOINT_URL.patch_application_data(id),
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    addRequestVerificationToken: true,
    processData: false,
    returnData: true,
    data: JSON.stringify({
      ...fieldData,
    }),
    ...options,
  });
}

export async function getDemographicInfoData({ id, ...options }) {
  return fetch({
    url: ENDPOINT_URL.get_demographic_info_data(id),
    returnData: true,
  });
}

export async function patchDemographicInfoData({ id, fieldData, ...options }) {
  return fetch({
    method: 'PATCH',
    url: ENDPOINT_URL.patch_demographic_info_data(id),
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    addRequestVerificationToken: true,
    processData: false,
    returnData: true,
    data: JSON.stringify({
      ...fieldData,
    }),
    ...options,
  });
}

export async function getTypesOfFoodData({ ...options } = {}) {
  return fetch({
    url: ENDPOINT_URL.get_types_of_food_data,
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    async: false,
    returnData: true,
    ...options,
  });
}

// export async function getCommoditiesData({ ...options } = {}) {
//   return fetch({
//     url: ENDPOINT_URL.get_commodities_data,
//     contentType: CONTENT_TYPE.json,
//     datatype: DATATYPE.json,
//     includeODataHeaders: true,
//     async: false,
//     returnData: true,
//     ...options,
//   });
// }

export async function getCommoditiesData({ onSuccess = null, ...options }) {
  return fetch({
    url: ENDPOINT_URL.get_commodities_data,
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    async: false,
    onSuccess,
    ...options,
  });
}

export async function getProgramIntakeData({ onSuccess = null, ...options }) {
  return fetch({
    url: ENDPOINT_URL.get_program_intake_data,
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    async: false,
    onSuccess,
    ...options,
  });
}

export async function getProgramHomePageContentData({ ...options } = {}) {
  return fetch({
    url: ENDPOINT_URL.get_program_home_page_content_data,
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    async: false,
    returnData: true,
    ...options,
  });
}

export async function getWorkbookDataById({ id, ...options }) {
  return fetch({
    url: ENDPOINT_URL.get_workbook_data_by_id(id),
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    returnData: true,
    ...options,
  });
}

export async function patchWorkbookData({ id, fieldData, ...options }) {
  return fetch({
    method: 'PATCH',
    url: ENDPOINT_URL.patch_workbook_data(id),
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    addRequestVerificationToken: true,
    processData: false,
    returnData: true,
    data: JSON.stringify({
      ...fieldData,
    }),
    ...options,
  });
}

export async function getChaptersData({ ...options } = {}) {
  return fetch({
    url: ENDPOINT_URL.get_chapters_data,
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    async: false,
    returnData: true,
    ...options,
  });
}

export async function getWorkbookQuestionsData({ ...options } = {}) {
  return fetch({
    url: ENDPOINT_URL.get_workbookquestions_data,
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    async: false,
    returnData: true,
    ...options,
  });
}

// Workbook Response API Functions
export async function getWorkbookResponsesData({ ...options } = {}) {
  return fetch({
    url: ENDPOINT_URL.get_workbookresponses_data,
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    returnData: true,
    ...options,
  });
}

export async function getWorkbookResponsesByWorkbook({ workbookId, ...options }) {
  if (!workbookId) {
    logger.error({
      fn: getWorkbookResponsesByWorkbook,
      message: 'Missing required workbookId parameter',
      data: { workbookId },
    });
    throw new Error('workbookId is required');
  }

  const result = await fetch({
    url: ENDPOINT_URL.get_workbookresponses_by_workbook(workbookId),
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    returnData: true,
    skipCache: true, // Always get fresh response data
    ...options,
  });

  // Transform the response structure to match the expected format
  // The API returns workbook data with expanded responses, but we want just the responses
  if (result && result.data && result.data.quartech_workbookresponse_Workbook_quartech_workbook) {
    const responses = result.data.quartech_workbookresponse_Workbook_quartech_workbook;
    return {
      ...result,
      data: {
        value: responses,
        '@odata.count': responses.length,
        '@odata.context': result.data['@odata.context']
      }
    };
  }

  return result;
}

export async function getWorkbookResponsesByWorkbookAndQuestion({
  workbookId,
  questionId,
  ...options
}) {
  if (!workbookId || !questionId) {
    logger.error({
      fn: getWorkbookResponsesByWorkbookAndQuestion,
      message: 'Missing required parameters',
      data: { workbookId, questionId },
    });
    throw new Error('workbookId and questionId are required');
  }

  const result = await fetch({
    url: ENDPOINT_URL.get_workbookresponses_by_workbook_and_question(workbookId, questionId),
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    returnData: true,
    skipCache: true, // Always get fresh response data
    ...options,
  });

  // Transform the response structure to match the expected format
  // The API returns workbook data with expanded responses filtered by question
  if (result && result.data && result.data.quartech_workbookresponse_Workbook_quartech_workbook) {
    const responses = result.data.quartech_workbookresponse_Workbook_quartech_workbook;
    return {
      ...result,
      data: {
        value: responses,
        '@odata.count': responses.length,
        '@odata.context': result.data['@odata.context']
      }
    };
  }

  return result;
}

export async function postWorkbookResponseData({
  workbookId,
  questionId,
  chapterId,
  response,
  ...options
}) {
  if (!workbookId || !questionId || response === undefined) {
    logger.error({
      fn: postWorkbookResponseData,
      message: 'Missing required parameters',
      data: { workbookId, questionId, response },
    });
    throw new Error('workbookId, questionId, and response are required');
  }

  logger.info({
    fn: postWorkbookResponseData,
    message: 'Creating workbook response',
    data: { workbookId, questionId, chapterId, response },
  });

  const payload = {
    quartech_response: response,
    'quartech_Workbook@odata.bind': `/quartech_workbooks(${workbookId})`,
    'quartech_Question@odata.bind': `/quartech_workbookquestions(${questionId})`,
  };

  // Add chapterId if provided
  if (chapterId) {
    payload['quartech_Chapter@odata.bind'] = `/quartech_chapters(${chapterId})`;
  }

  // Add description if provided in options
  if (options.description !== undefined && options.description !== null) {
    payload.quartech_description = options.description;
  }

  return fetch({
    method: 'POST',
    url: ENDPOINT_URL.post_workbookresponse_data,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    addRequestVerificationToken: true,
    processData: false,
    returnData: true,
    data: JSON.stringify(payload),
    ...options,
  });
}

export async function patchWorkbookResponseData({
  id,
  response = null,
  chapterId = null,
  ...options
}) {
  if (!id) {
    logger.error({
      fn: patchWorkbookResponseData,
      message: 'Missing required id parameter',
      data: { id },
    });
    throw new Error('id is required');
  }

  const updateData = {};
  if (response !== null) updateData.quartech_response = response;
  if (chapterId !== null) updateData['quartech_Chapter@odata.bind'] = `/quartech_chapters(${chapterId})`;

  // Add description if provided in options
  if (options.description !== undefined && options.description !== null) {
    updateData.quartech_description = options.description;
  }

  if (Object.keys(updateData).length === 0) {
    logger.warn({
      fn: patchWorkbookResponseData,
      message: 'No data to update',
      data: { id, response, chapterId },
    });
    return Promise.resolve({ data: null });
  }

  logger.info({
    fn: patchWorkbookResponseData,
    message: 'Updating workbook response',
    data: { id, updateData },
  });

  return fetch({
    method: 'PATCH',
    url: ENDPOINT_URL.patch_workbookresponse_data(id),
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    addRequestVerificationToken: true,
    processData: false,
    returnData: true,
    data: JSON.stringify(updateData),
    ...options,
  });
}

export async function deleteWorkbookResponseData({ id, ...options }) {
  if (!id) {
    logger.error({
      fn: deleteWorkbookResponseData,
      message: 'Missing required id parameter',
      data: { id },
    });
    throw new Error('id is required');
  }

  logger.info({
    fn: deleteWorkbookResponseData,
    message: 'Deleting workbook response',
    data: { id },
  });

  return fetch({
    method: 'DELETE',
    url: ENDPOINT_URL.delete_workbookresponse_data(id),
    addRequestVerificationToken: true,
    returnData: true,
    ...options,
  });
}

export async function getPortalPageData({ params = '', ...options } = {}) {
  return fetch({
    url: ENDPOINT_URL.get_portal_page_data(params),
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    returnData: true,
    ...options,
  });
}

// Action Plan API Functions
export async function getActionPlansData({ ...options } = {}) {
  return fetch({
    url: ENDPOINT_URL.get_actionplans_data,
    contentType: CONTENT_TYPE.json,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    returnData: true,
    skipCache: true,
    ...options,
  });
}

export async function postActionPlanData({
  workbookId,
  chapterId,
  questionId,
  action,
  ...options
}) {
  if (!workbookId || !action) {
    logger.error({
      fn: postActionPlanData,
      message: 'Missing required parameters',
      data: { workbookId, chapterId, questionId, action },
    });
    throw new Error('workbookId and action are required');
  }

  logger.info({
    fn: postActionPlanData,
    message: 'Creating action plan',
    data: { workbookId, chapterId, questionId, action },
  });

  const payload = {
    quartech_action: action,
    'quartech_Workbook@odata.bind': `/quartech_workbooks(${workbookId})`,
  };

  // Add chapterId if provided
  if (chapterId) {
    payload['quartech_chapter@odata.bind'] = `/quartech_chapters(${chapterId})`;
  }

  // Add questionId if provided
  if (questionId) {
    payload['quartech_workbookquestion@odata.bind'] = `/quartech_workbookquestions(${questionId})`;
  }

  return fetch({
    method: 'POST',
    url: ENDPOINT_URL.post_actionplan_data,
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    addRequestVerificationToken: true,
    processData: false,
    returnData: true,
    data: JSON.stringify(payload),
    ...options,
  });
}

export async function patchActionPlanData({
  actionPlanId,
  action,
  chapterId,
  questionId,
  ...options
}) {
  if (!actionPlanId || !action) {
    logger.error({
      fn: patchActionPlanData,
      message: 'Missing required parameters',
      data: { actionPlanId, action, chapterId, questionId },
    });
    throw new Error('actionPlanId and action are required');
  }

  logger.info({
    fn: patchActionPlanData,
    message: 'Updating action plan',
    data: { actionPlanId, action, chapterId, questionId },
  });

  const payload = {
    quartech_action: action,
  };

  // Add chapterId if provided (null clears it)
  if (chapterId !== undefined) {
    if (chapterId) {
      payload['quartech_chapter@odata.bind'] = `/quartech_chapters(${chapterId})`;
    } else {
      payload['quartech_chapter@odata.bind'] = null;
    }
  }

  // Add questionId if provided (null clears it)
  if (questionId !== undefined) {
    if (questionId) {
      payload['quartech_workbookquestion@odata.bind'] = `/quartech_workbookquestions(${questionId})`;
    } else {
      payload['quartech_workbookquestion@odata.bind'] = null;
    }
  }

  return fetch({
    method: 'PATCH',
    url: ENDPOINT_URL.patch_actionplan_data(actionPlanId),
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    addRequestVerificationToken: true,
    processData: false,
    returnData: true,
    data: JSON.stringify(payload),
    ...options,
  });
}

export async function deleteActionPlanData({ actionPlanId, ...options }) {
  if (!actionPlanId) {
    logger.error({
      fn: deleteActionPlanData,
      message: 'Missing required parameter',
      data: { actionPlanId },
    });
    throw new Error('actionPlanId is required');
  }

  logger.info({
    fn: deleteActionPlanData,
    message: 'Deleting action plan',
    data: { actionPlanId },
  });

  return fetch({
    method: 'DELETE',
    url: ENDPOINT_URL.delete_actionplan_data(actionPlanId),
    datatype: DATATYPE.json,
    includeODataHeaders: true,
    addRequestVerificationToken: true,
    processData: false,
    returnData: false,
    ...options,
  });
}
