type CommoditiesDataBlob = {
    value: Array<CommoditiesBlob>;
};
type CommoditiesBlob = {
    quartech_name: string;
    quartech_category: string;
    'quartech_category@OData.Community.Display.V1.FormattedValue': string;
    '_quartech_naicscode_value@OData.Community.Display.V1.FormattedValue': string;
};
export type Commodities = {
    [key: string]: Commodity;
};
type Commodity = {
    name: string;
    category: number;
    categoryDescription: string;
    naicsDescription: string;
};
export declare function getCommodities(): Promise<CommoditiesBlob>;
export declare function processCommoditiesData(json: CommoditiesDataBlob): CommoditiesBlob;
export {};
