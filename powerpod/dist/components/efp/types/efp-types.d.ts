/**
 * Type definitions for EFP Entry Form components
 * Extracted from EFPEntryForm.ts for better maintainability
 */
export interface EFPStep {
    label: string;
    content: string;
    complete?: boolean;
    sectionIndex: number;
    chapterData?: any;
    subchapterData?: any;
    isContainer?: boolean;
    questionId?: string;
    chapterId?: string;
}
export interface EFPSection {
    tab: string;
    title: string;
    items: EFPSectionItem[];
}
export interface EFPSectionItem {
    label: string;
    content?: string;
    complete?: boolean;
    items?: EFPSectionItem[];
    title?: string;
    isContainer?: boolean;
    chapterData?: any;
    subchapterData?: any;
    questionId?: string;
    chapterId?: string;
}
export interface EFPActiveContent {
    title: string;
    content: string;
}
export interface EFPNavigationState {
    currentSectionIndex: number;
    currentStepIndex: number;
    isNavigating: boolean;
}
export interface EFPDataState {
    nestedChapterStructure: any[];
    workbookResponses: any[];
    isLoadingResponses: boolean;
    questionnaireStoreLoaded: boolean;
}
export interface EFPCompletionStats {
    totalQuestions: number;
    answeredQuestions: number;
    completionPercentage: number;
}
export interface EFPQuestionData {
    id: string;
    text: string;
    type: string;
    tooltip?: string;
    options?: any[];
    required?: boolean;
    chapterId?: string;
}
export interface EFPResponseData {
    questionId: string;
    response: string;
    notes?: string;
    responseId?: string;
    workbookId?: string;
    chapterId?: string;
    createdOn?: string;
    modifiedOn?: string;
}
export interface EFPChapterData {
    id: string;
    name: string;
    label?: string;
    description?: string;
    order: number;
    questions?: EFPQuestionData[];
    subchapters?: EFPChapterData[];
    complete?: boolean;
}
export interface EFPWorkbookData {
    id: string;
    name?: string;
    responses: EFPResponseData[];
    chapters: EFPChapterData[];
}
export interface EFPEventDetail {
    sectionIndex?: number;
    stepIndex?: number;
    questionId?: string;
    response?: string;
    notes?: string;
}
export interface EFPBreadcrumbItem {
    label: string;
    sectionIndex: number;
    stepIndex: number;
    isActive: boolean;
    isComplete: boolean;
}
export interface EFPRatingQuestionData extends EFPQuestionData {
    ratingScale?: {
        min: number;
        max: number;
        labels?: string[];
    };
}
export interface EFPValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}
export interface EFPFormState {
    isDirty: boolean;
    isValid: boolean;
    hasUnsavedChanges: boolean;
    lastSaved?: Date;
}
export interface EFPUIState {
    activeContent: EFPActiveContent;
    sections: EFPSection[];
    flatSteps: EFPStep[];
    completionPercent: number;
}
export type EFPNavigationEvent = CustomEvent<EFPEventDetail>;
export type EFPResponseEvent = CustomEvent<EFPEventDetail>;
export type EFPBreadcrumbEvent = CustomEvent<EFPEventDetail>;
export interface EFPConfig {
    debugMode: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
    maxRetries: number;
    loadingTimeout: number;
}
export interface EFPTheme {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    chapterFont: string;
    spacing: {
        small: string;
        medium: string;
        large: string;
    };
}
export interface EFPComponentProps {
    currentStep?: EFPStep;
    currentSection?: EFPSection;
    currentSectionIndex?: number;
    currentStepIndex?: number;
    flatSteps?: EFPStep[];
    sections?: EFPSection[];
    workbookId?: string;
    isLoading?: boolean;
    config?: EFPConfig;
    theme?: EFPTheme;
}
export interface EFPAPIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface EFPQuestionnaireResponse extends EFPAPIResponse {
    data?: {
        chapters: EFPChapterData[];
        metadata?: {
            version: string;
            lastUpdated: string;
        };
    };
}
export interface EFPWorkbookResponse extends EFPAPIResponse {
    data?: {
        workbook: EFPWorkbookData;
        responses: EFPResponseData[];
    };
}
export interface EFPStoreState {
    questionnaire: {
        chapters: EFPChapterData[];
        isLoaded: boolean;
        lastUpdated?: string;
    };
    workbook: {
        id?: string;
        responses: Map<string, EFPResponseData>;
        isLoaded: boolean;
        lastUpdated?: string;
    };
    ui: EFPUIState;
    navigation: EFPNavigationState;
    form: EFPFormState;
}
export declare class EFPError extends Error {
    code?: string | undefined;
    context?: any;
    constructor(message: string, code?: string | undefined, context?: any);
}
export declare class EFPValidationError extends EFPError {
    field?: string | undefined;
    value?: any;
    constructor(message: string, field?: string | undefined, value?: any);
}
export declare class EFPNetworkError extends EFPError {
    status?: number | undefined;
    response?: any;
    constructor(message: string, status?: number | undefined, response?: any);
}
export declare const EFP_CONSTANTS: {
    readonly DEFAULT_SECTION_INDEX: 0;
    readonly DEFAULT_STEP_INDEX: 0;
    readonly AUTO_SAVE_INTERVAL: 30000;
    readonly LOADING_TIMEOUT: 30000;
    readonly MAX_RETRIES: 3;
    readonly QUESTIONNAIRE_CHECK_INTERVAL: 500;
    readonly QUESTIONNAIRE_CHECK_TIMEOUT: 30000;
};
export declare const EFP_EVENTS: {
    readonly NAVIGATION_PREVIOUS: "efp:navigation:previous";
    readonly NAVIGATION_NEXT: "efp:navigation:next";
    readonly NAVIGATION_SKIP: "efp:navigation:skip";
    readonly SECTION_CHANGE: "efp:section:change";
    readonly STEP_CHANGE: "efp:step:change";
    readonly RESPONSE_SAVE: "efp:response:save";
    readonly RESPONSE_UPDATE: "efp:response:update";
    readonly BREADCRUMB_NAVIGATE: "efp:breadcrumb:navigate";
    readonly QUESTIONNAIRE_LOADED: "efp:questionnaire:loaded";
    readonly WORKBOOK_LOADED: "efp:workbook:loaded";
};
export declare const EFP_CSS_CLASSES: {
    readonly CONTAINER: "efp-container";
    readonly SIDEBAR: "efp-sidebar";
    readonly MAIN_CONTENT: "efp-main-content";
    readonly CARD: "efp-card";
    readonly NAVIGATION: "efp-navigation";
    readonly BREADCRUMBS: "efp-breadcrumbs";
    readonly QUESTION: "efp-question";
    readonly RATING: "efp-rating";
    readonly COMPLETE: "efp-complete";
    readonly INCOMPLETE: "efp-incomplete";
    readonly LOADING: "efp-loading";
    readonly ERROR: "efp-error";
};
