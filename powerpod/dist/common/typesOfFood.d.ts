type TypesOfFoodDataBlob = {
    value: Array<TypesOfFoodBlob>;
};
type TypesOfFoodBlob = {
    quartech_name: string;
    quartech_typeoffoodid: string;
};
export type TypesOfFood = string;
export declare function getTypesOfFood(): Promise<string[]>;
export declare function processTypesOfFoodData(json: TypesOfFoodDataBlob): string[];
export {};
