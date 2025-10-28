export function configureCustomLogo(customLogo: any): void;
export function redirectToFormId(id: any): void;
export function getControlType({ tr, controlId, skipState }: {
    tr: any;
    controlId?: string | undefined;
    skipState?: boolean | undefined;
}): any;
export function isEmptyRow(tr: any): boolean;
export function isHiddenRow(tr: any): boolean;
export function getControlId(tr: any, controlType?: string): string | undefined;
export function getInfoValue(tr: any): any;
export function getControlValue({ controlId, tr, raw, forTemplateGeneration, }: {
    controlId: any;
    tr?: undefined;
    raw?: boolean | undefined;
    forTemplateGeneration?: boolean | undefined;
}): any;
export function newGetOriginalMultiOptionSetElementValue(controlId: any, raw: any): string | undefined;
export function getMultiOptionSetElementValue(controlId: any, raw: any): string | undefined;
export function listenForIframeReadyStateChanges(iframe: any, fn: any): void;
export function onDocumentReadyState(fn: any): void;
export function showFieldsetElement(fieldsetName: any): void;
export function getFieldLabel(fieldName: any): string;
export function getFieldRow(fieldName: any): HTMLTableRowElement | undefined;
export function hideFieldRow({ fieldName, doNotBlank }: {
    fieldName: any;
    doNotBlank?: boolean | undefined;
}): void;
export function showFieldRow(fieldName: any): void;
export function addHtmlToTabDiv(tabDataName: any, htmlContentToAdd: any, topOrBottom?: string): void;
export function hideSection(tableDataname: any): void;
export function showSection(tableDataname: any): void;
export function hideTable(tableDataname: any): void;
export function showTable(tableDataname: any): void;
export function addTextAboveSection(tableDataName: any, htmlContentToAdd: any): void;
export function addTextBelowSection(tableDataName: any, htmlContentToAdd: any): void;
export function addTextAboveSubsection(subsectionAriaLabel: any, htmlContentToAdd: any): void;
export function addTextBelowSubsection(subsectionAriaLabel: any, htmlContentToAdd: any): void;
export function addHtmlToSubsection(subsectionAriaLabel: any, htmlContentToAdd: any, topOrBottom?: string): void;
export function addTextBelowLabel(labelId: any, htmlToInsert: any): void;
export function addTextAboveLabel(labelId: any, htmlToInsert: any): void;
export function insertHtmlAroundLabel(labelId: any, htmlToInsert: any, position?: string): void;
export function boldLabelText(labelId: any): void;
export function addHtmlToSection(tableDataName: any, htmlContentToAdd: any, topOrBottom: string | undefined, type: any): void;
export function addTextAboveField(fieldName: any, htmlContentToAdd: any): void;
export function addTextBelowField(fieldName: any, htmlContentToAdd: any): void;
export function generatePlaceholderRowForCustomField(name: any, label: any): string;
export function addCustomField(customFieldName: any, customFieldLabel: any, existingFieldName: any, sectionDataName: any, beforeOrAfter?: string): void;
export function addHtmlToField(fieldName: any, htmlContentToAdd: any, topOrBottom?: string): void;
export function observeChanges(element: any, customFunc: any, disableInitialCall?: boolean): false | MutationObserver | undefined;
export function observeIframeChanges(funcToExecute: any, fieldNameToPass: any, fieldNameToObserve: any): void;
export function hideFieldByFieldName(fieldName: any, doNotBlank?: boolean): void;
export function hideQuestion(fieldName: any): void;
export function showOrHideAndReturnValue(valueElementId: any, descriptionElementId: any): number;
/**
 * Programmatically set a field value and trigger change event.
 * Ensures validation checks pick up on change event.
 * @function
 * @param {string} name - The name of the associated field id.
 * @param {string} value - The value to set the field to.
 */
export function setFieldValue({ name, value, elementType, skipValidation, }: string): void;
export function relocateField(field: any): void;
export function combineElementsIntoOneRowNew(name: any): void;
export function disableSingleLine(name: any, elementType?: string): void;
export function combineElementsIntoOneRow(valueElementId: any, descriptionInputElementId: any): void;
export function hideAllStepSections(): void;
export function showAllStepSections(): void;
export function hideFields(hidden?: boolean): void;
export function hideFieldSets(hidden?: boolean): void;
export function hideFieldsAndSections(hidden?: boolean): void;
export function isNode(o: any): any;
export function getFieldNameLabel(fieldName: any): string | undefined;
export function setFieldNameLabel(fieldName: any, label: any): void;
export function htmlDecode(input: any): string;
export function copyFromFieldAToFieldB(fromFieldNameA: any, toFieldNameB: any): void;
export function hideFieldsetTitle(ariaLabel: any): void;
export function getFieldInfoDiv(name: any): JQuery<HTMLElement> | undefined;
export function getOriginalMsosElement(name: any): JQuery<HTMLElement> | undefined;
export function setMultiSelectValues(name: any, values?: any[]): void;
export function getFieldErrorDiv(fieldName: any): Element | undefined;
export function setFieldValueToEmptyState(fieldName: any): void;
export function renameSectionLabel(name: any, newLabel: any): void;
export function removeDropdownOptions(name: any, removeDropdownOptionsValues: any): void;
export function moveTableRow(rowIdToMove: any, referenceRowId: any, position?: string): void;
export function normalizeTableCells(): void;
export function hideNumberInputArrowsById(inputId: any): void;
export function isSignatureFilled(): boolean | undefined;
