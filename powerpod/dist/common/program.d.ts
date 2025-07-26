export declare function getProgramIdFromUrlParams(): string | undefined;
/**
 * Gets the ID of the currently active program.
 * @function
 */
export declare function getProgramId(): Promise<{
    programId: any;
    formId: any;
    redirect?: undefined;
} | {
    programId: string;
    formId: any;
    redirect: boolean;
} | {
    programId: string | number | string[] | null;
    formId?: undefined;
    redirect?: undefined;
}>;
export declare function getProgramAbbreviation(): any;
export declare function getCurrentStep(): string;
export declare function getProgramEmailAddress(): any;
export declare function getProgramData(): any;
