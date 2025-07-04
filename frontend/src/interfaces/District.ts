import type { ProvinceInterface } from "./Province";

export interface DistrictInterface {
  ID: number;
  name_th: string;
  name_en: string;
  province_id: number;
  Province?: ProvinceInterface;
}