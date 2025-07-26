type ExpenseTypesDataBlob = {
    value: Array<ExpenseTypeBlob>;
};
type ExpenseTypeBlob = {
    quartech_expensetype: string;
    quartech_expensetypeid: string;
};
type RowItem = {
    [key: string]: string;
};
export type ExpenseType = string;
export declare function getExpenseTypes(): Promise<string[]>;
export declare function processExpenseTypesDataFromProgramData(data: any): any[];
export declare function processExpenseTypesData(json: ExpenseTypesDataBlob): string[];
export declare function getTotalExpenseAmount(rowData: RowItem[]): string;
export declare function getTotalInvoicesAmount(rowData: RowItem[]): string;
export {};
