export type UploadedDoc = {
    filename: string;
    filesize: number;
    mimetype: string;
    status: string;
    subject: string | null;
    modifiedon: string | null;
    documentbody: string | null;
    annotationid: string | null;
    fileId: string | null;
};
export type UploadedDocBlob = {
    annotationid: string;
    subject: string;
    filename: string;
    filesize: number;
    'modifiedon@OData.Community.Display.V1.FormattedValue': string;
    documentbody: string | null;
    mimetype: string;
};
export type RawFile = {
    lastModified: number;
    lastModifiedDate: Date;
    name: string;
    type: string;
    webkitRelativePath: string;
    size: number;
};
export declare const MAXIMUM_FILE_SIZE_IN_KB = 15360;
export declare const MAXIMUM_FILE_SIZE_TEXT = "15MB";
export declare const ALLOWED_MIME_TYPES: string[];
export declare const MINIFIED_MIME_TYPES: string[];
export declare const ALLOWED_FILE_TYPES: string[];
export declare const CLAIM_FILE_UPLOAD_FIELDS: string[];
export declare const APPLICATION_FILE_UPLOAD_FILES: string[];
export declare function getFilenamesFromDocData(data: any, fieldName?: string): any;
export declare function getFilenamesFromFieldData(fieldName: any): any[];
export declare function compareDocDataToUploadFieldData(fieldName: any, data: any): any[][];
export declare function formatBytes(bytes: any, decimals?: number, forceFormat?: null, returnFloat?: boolean): string | number;
export declare function readFileInputStr(fileInputStr: string, docs: UploadedDoc[]): UploadedDoc[];
export declare function generateFileInputStr(docs: UploadedDoc[]): string;
export declare function generateDocumentSubject(file: RawFile, fieldName?: string): Promise<{
    subject: string;
    fileId: string;
}>;
export declare function postDocument(file: RawFile, fieldName: string): Promise<void>;
export declare function processDocumentsData(data: any): any;
export declare function deleteDocuments(formId: any, documents?: never[]): Promise<void>;
export declare function validateFileUpload(file: any): boolean;
export declare function addDocumentsStepText(overrideWithElement?: null, overrideWithPrepend?: boolean): void;
export declare function separateFileNameAndExtension(fileName: any): {
    name: any;
    extension: any;
};
export declare function convertExtensionToLowerCase(fileName: any): any;
export declare function cleanString(inputString: any): any;
