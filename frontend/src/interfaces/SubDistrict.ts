import type { DistrictInterface } from "./District";
import type { PostcodeInterface } from "./Postcode";

export interface SubDistrictInterface {
    ID: number;
    name_th: string;
    name_en: string;
    district_id: number;
    District?: DistrictInterface;
    postcode_id: number;
    Postcode?: PostcodeInterface;
}