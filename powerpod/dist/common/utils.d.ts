export function enableDebugging(): void;
export function disableDebugging(): void;
export function enableCanadaPostIntegration(): void;
export function disableCanadaPostIntegration(): void;
export function isObject(value: any): any;
export function convertObjectToString(value: any): any;
export function isValidJSON(jsonString: any): boolean;
/**
 * Equivalent of jQuery function $().
 */
export function $(selector: any, context: any, ...args: any[]): any;
/**
 * Extends a given Object properties and its childs.
 */
export function deepExtend(out: any, ...args: any[]): any;
export function mergeObjects(a: any, b: any): any;
export function mergeFieldArrays(a: any, b: any, prop: any): {};
export function sortArrayByProperty(array: any, propertyName: any): any;
export function hasUpperCase(str: any): any;
export function filterEmptyRows(rowData: any): any;
export function isAnyOfLastThreeObjectsEmpty(array: any): any;
export function sha256(str: any): Promise<string>;
export function getBrowserInfo(): string;
export function saveBrowserInfo(action?: string): Promise<void>;
export function delay(delayInms: any): Promise<any>;
export function isObjectEmpty(objectName: any): any;
