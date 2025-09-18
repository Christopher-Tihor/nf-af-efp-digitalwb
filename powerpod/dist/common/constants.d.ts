export const win: Window & typeof globalThis;
export const doc: Document;
export namespace Environment {
    let DEV: string;
    let TEST: string;
    let PROD: string;
}
export const Hosts: {
    [x: string]: string[];
};
export const ClaimPaths: string[];
export const ApplicationPaths: string[];
export const HomePaths: string[];
export const WorkbookPaths: string[];
export namespace Form {
    let Application: string;
    let Claim: string;
    let StaffPortalClaim: string;
    let Workbook: string;
}
export namespace Page {
    let Home: string;
}
export namespace BrowserInformationType {
    let Information: number;
    let Warning: number;
    let Error: number;
}
export namespace BrowserInformationAction {
    let Load: string;
    let Save: string;
    let Next: string;
}
export namespace HtmlElementType {
    let Input: string;
    let CurrencyInput: string;
    let TextArea: string;
    let FileInput: string;
    let SingleOptionSet: string;
    let MultiOptionSet: string;
    let MultiSelectPicklist: string;
    let DropdownSelect: string;
    let DatePicker: string;
    let Checkbox: string;
    let NotesControl: string;
    let Unknown: string;
    let SignatureControl: string;
}
export namespace FormStep {
    export let Documents: string;
    export let DeclarationAndConsent: string;
    export let ApplicantInfo: string;
    export let Eligibility: string;
    export let Project: string;
    export let DeliverablesBudget: string;
    export let DemographicInfo: string;
    export let ProjectResults: string;
    export let ClaimInfo: string;
    let Unknown_1: string;
    export { Unknown_1 as Unknown };
    export let Success: string;
}
export const TabDisplayNames: {
    [x: string]: string | string[];
};
export const TabNames: {
    [x: string]: string | string[];
};
export namespace ProgramIds {
    let VLB: string;
}
export const YES_VALUE: "255550000";
export const NO_VALUE: "255550001";
export const OTHER_VALUE: "255550010";
export const GROUP_APPLICATION_VALUE: "255550001";
export const SECTOR_WIDE_ID_VALUE: "6ce2584f-4740-ee11-be6e-000d3af3ac95";
export namespace POWERPOD {
    let state: {};
    let program: {};
    let applicationUtils: {};
    let test: {};
    let shared: {};
    namespace validation {
        let enableIntervalBased: boolean;
        let errorHtml: string;
    }
    let fieldValidation: {};
    let documents: {};
    let docUtils: {};
    let fetch: {};
    let dynamics: {};
    let options: {};
    let logger: {};
    let saveButton: {};
    let doNotUnhideLoader: boolean;
    let redirectToNewId: boolean;
    let components: {};
    let onChangeHandlers: {};
    let customEventHandlers: {};
    let initValuesFns: {};
    let valueGeneration: {};
    let loading: boolean;
    let loadingFieldsIntoState: boolean;
    let configuringFields: boolean;
    let dateUtils: {};
    let utils: {};
    let typesOfFood: {};
    let fieldConditionalLogic: {};
    let fieldConfiguration: {};
    let commodities: {};
    let expenseTypes: {};
    let examples: {};
    let workbookResponseHelper: null;
    namespace workbookResponses {
        let data: any[];
        let responsesByQuestion: Map<string, any>;
        let isLoaded: boolean;
        let isLoading: boolean;
        let workbookId: string | null;
        let lastUpdated: string | null;
        let error: string | null;
    }
    namespace workbookQuestions {
        let data_1: never[];
        export { data_1 as data };
        export let questionsById: Map<any, any>;
        export let questionsByChapter: Map<any, any>;
        let isLoaded_1: boolean;
        export { isLoaded_1 as isLoaded };
        let isLoading_1: boolean;
        export { isLoading_1 as isLoading };
        let workbookId_1: null;
        export { workbookId_1 as workbookId };
        let lastUpdated_1: null;
        export { lastUpdated_1 as lastUpdated };
        let error_1: null;
        export { error_1 as error };
    }
    namespace workbookQuestionsAndResponses {
        export let questionsWithResponses: Map<string, any>;
        let questionsByChapter_1: Map<string, any[]>;
        export { questionsByChapter_1 as questionsByChapter };
        export namespace stats {
            export let totalQuestions: number;
            export let answeredQuestions: number;
            export let unansweredQuestions: number;
            export let completionPercentage: number;
            let lastUpdated_2: string | null;
            export { lastUpdated_2 as lastUpdated };
        }
        let isLoaded_2: boolean;
        export { isLoaded_2 as isLoaded };
        let isLoading_2: boolean;
        export { isLoading_2 as isLoading };
        let workbookId_2: string | null;
        export { workbookId_2 as workbookId };
        let lastUpdated_3: string | null;
        export { lastUpdated_3 as lastUpdated };
        let error_2: string | null;
        export { error_2 as error };
    }
}
