export function validateRequiredFields(): void;
export function validateStepField(fieldName: any): void;
export function validateStepFields(stepName: any, returnString: any): string | undefined;
export function isValueEmpty(value: any, elemType: any): boolean;
export function validateRequiredField({ fieldName, elemType, errorMessage, }: {
    fieldName: any;
    elemType?: string | undefined;
    errorMessage?: string | undefined;
}): string;
export function validateDateFieldValue({ fieldName, comparisonFieldName, operator, errorMessage, }: {
    fieldName: any;
    comparisonFieldName: any;
    operator: any;
    errorMessage?: string | undefined;
}): string | false | undefined;
export function validateNumericFieldValue({ fieldName, comparisonValue, operator, forceRequired, errorMessage, }: {
    fieldName: any;
    comparisonValue: any;
    operator: any;
    forceRequired?: boolean | undefined;
    errorMessage?: string | undefined;
}): string | undefined;
export function validateNumericValue(inputStr: any, operator: any, comparisonValue: any): string;
export function validateFieldLength(fieldName: any, comparisonValue: any, operator: any, forceRequired?: boolean, postfix?: undefined, overrideDisplayValue?: undefined): string | undefined;
export function validateEmailAddressField(fieldName: any): "" | "Please enter a valid email address." | undefined;
export function validateEmail(inputStr: any): "" | "Please enter a valid email address.";
export function displayActiveFieldErrors(): void;
export function displayValidationErrors(validationErrorHtml: any): void;
export function addValidationCheck(fieldName: any, validation: any): void;
export function setInputMaxLength(fieldName: any, maxLength: any): void;
export function setInputMaxWords(fieldName: any, maxWords: any): void;
export function setInputMaxChars(fieldName: any, maxChars: any): void;
export function setFieldReadOnly(fieldName: any): void;
export function validateSignatureField(name: any): "" | "Please ensure you have filled out & saved your signature.";
