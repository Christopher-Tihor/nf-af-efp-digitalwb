export function fetch(params: any): Promise<any>;
export function getEnvVarsData({ ...options }?: {}): Promise<any>;
export function getApplicationFormData({ programId, beforeSend, onSuccess, ...options }: {
    [x: string]: any;
    programId: any;
    beforeSend: any;
    onSuccess: any;
}): Promise<any>;
export function getClaimFormData({ programId, beforeSend, onSuccess, ...options }: {
    [x: string]: any;
    programId: any;
    beforeSend: any;
    onSuccess: any;
}): Promise<any>;
export function getMunicipalData({ onSuccess, ...options }: {
    [x: string]: any;
    onSuccess?: null | undefined;
}): Promise<any>;
export function getExpenseTypeData({ ...options }?: {}): Promise<any>;
export function getOrgbookAutocompleteData({ searchStr, onSuccess, ...options }: {
    [x: string]: any;
    searchStr: any;
    onSuccess: any;
}): Promise<any>;
export function getOrgbookTopicData({ topicSourceId, ...options }: {
    [x: string]: any;
    topicSourceId: any;
}): Promise<any>;
export function getOrgbookCredentialsData({ topicId, ...options }: {
    [x: string]: any;
    topicId: any;
}): Promise<any>;
export function getDocumentsData({ formId, ...options }: {
    [x: string]: any;
    formId: any;
}): Promise<any>;
export function getDocumentData({ annotationId, ...options }: {
    [x: string]: any;
    annotationId: any;
}): Promise<any>;
export function postDocumentData({ formId, subject, filename, documentbody, mimetype, formType, ...options }: {
    [x: string]: any;
    formId: any;
    subject: any;
    filename: any;
    documentbody: any;
    mimetype: any;
    formType: any;
}): Promise<any>;
export function deleteDocumentData({ annotationId, ...options }: {
    [x: string]: any;
    annotationId: any;
}): Promise<any>;
export function getContactData({ contactId, ...options }: {
    [x: string]: any;
    contactId: any;
}): Promise<any>;
export function patchClaimData({ id, fieldData, ...options }: {
    [x: string]: any;
    id: any;
    fieldData: any;
}): Promise<any>;
export function getApplicationData({ id, ...options }: {
    [x: string]: any;
    id: any;
}): Promise<any>;
export function getClaimData({ id, ...options }: {
    [x: string]: any;
    id: any;
}): Promise<any>;
export function getDraftApplicationsForProgramIdData({ programid, ...options }: {
    [x: string]: any;
    programid: any;
}): Promise<any>;
export function postApplicationData({ id, programid, contactid, quartech_nocragstnumber, ...options }: {
    [x: string]: any;
    id: any;
    programid: any;
    contactid: any;
    quartech_nocragstnumber?: null | undefined;
}): Promise<any>;
export function postBrowserInformationData({ claimId, applicationId, payload, action, type, contactId, ...options }: {
    [x: string]: any;
    claimId?: null | undefined;
    applicationId?: null | undefined;
    payload?: string | undefined;
    action: any;
    type: any;
    contactId: any;
}): Promise<any>;
export function patchApplicationData({ id, fieldData, ...options }: {
    [x: string]: any;
    id: any;
    fieldData: any;
}): Promise<any>;
export function getDemographicInfoData({ id, ...options }: {
    [x: string]: any;
    id: any;
}): Promise<any>;
export function patchDemographicInfoData({ id, fieldData, ...options }: {
    [x: string]: any;
    id: any;
    fieldData: any;
}): Promise<any>;
export function getTypesOfFoodData({ ...options }?: {}): Promise<any>;
export function getCommoditiesData({ onSuccess, ...options }: {
    [x: string]: any;
    onSuccess?: null | undefined;
}): Promise<any>;
export function getProgramIntakeData({ onSuccess, ...options }: {
    [x: string]: any;
    onSuccess?: null | undefined;
}): Promise<any>;
export function getProgramHomePageContentData({ ...options }?: {}): Promise<any>;
export namespace ENDPOINT_URL {
    let get_env_vars_data: string;
    function get_application_form_data(programId: any): string;
    function get_claim_form_data(programId: any): string;
    let get_municipal_data: string;
    let get_expense_type_data: string;
    function get_documents_data(formId: any): string;
    function get_document_data(annotationId: any): string;
    let post_document_data: string;
    function delete_document_data(annotationId: any): string;
    function get_contact_data(contactId: any): string;
    let get_orgbook_autocomplete_data: string;
    let get_orgbook_topic_data: string;
    function get_orgbook_credentials_data(topicId: any): string;
    function patch_quartech_claim_data(id: any): string;
    function get_claim_data(id: any): string;
    function patch_application_data(id: any): string;
    function get_application_data(id: any): string;
    function get_draft_applications_for_programid_data(programid: any): string;
    let post_application_data: string;
    function get_demographic_info_data(demographicInfoId: any): string;
    function patch_demographic_info_data(demographicInfoId: any): string;
    let post_browserinformation_data: string;
    let get_types_of_food_data: string;
    let get_commodities_data: string;
    let get_program_intake_data: string;
    let get_program_home_page_content_data: string;
    function get_workbook_data_by_id(id: any): string;
}
