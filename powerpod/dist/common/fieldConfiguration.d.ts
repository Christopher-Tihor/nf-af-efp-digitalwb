export function configureField(field: any): void;
export function configureFields(): void;
export function updateFieldValue({ name, value, skipValidation, origin, }: {
    name: any;
    value?: undefined;
    skipValidation?: boolean | undefined;
    origin?: string | undefined;
}): void;
export function setDirtyField(name: any): void;
export function validateNeededFields({ name, origin }: {
    name: any;
    origin?: string | undefined;
}): void;
export function setFieldObserver(name: any, format?: string): void;
export function setRequiredField(fieldName: any, elemType?: string, validationErrorMessage?: string): void;
export function unsetRequiredField(fieldName: any): void;
export function setDynamicallyRequiredFields(stepName: any): void;
