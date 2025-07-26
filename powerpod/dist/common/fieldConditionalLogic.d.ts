export function assignDependentFields(fieldConfig: any): void;
export function checkControlDependentFields(params: any): void;
export function setFieldVisibility(name: any, visibleIf?: {}, condition?: undefined): void;
export function checkVisibleIfComparison({ name, dependentOnFieldName, controlValue, comparison, value, }: {
    name: any;
    dependentOnFieldName: any;
    controlValue: any;
    comparison: any;
    value: any;
}): boolean;
export function checkVisibleIfCondition({ name, controlValue, selectedValue, selectedValueIn, }: {
    name: any;
    controlValue: any;
    selectedValue: any;
    selectedValueIn: any;
}): boolean;
