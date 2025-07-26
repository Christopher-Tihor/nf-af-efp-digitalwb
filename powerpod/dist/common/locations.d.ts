type LocationsDataBlob = {
    value: Array<MunicipalBlob>;
};
type MunicipalBlob = {
    quartech_name: string;
    quartech_RegionalDistrict: {
        quartech_name: string;
    };
};
export type Municipals = {
    [key: string]: Locations;
};
type Locations = string[];
export declare function processLocationData(json: LocationsDataBlob): Municipals;
export {};
