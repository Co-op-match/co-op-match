import type { DistrictInterface } from "./District";
import type { PostcodeInterface } from "./Postcode";
import type { ProvinceInterface } from "./Province";
import type { SubDistrictInterface } from "./SubDistrict";

export interface AddressInterface {
  id?: number;

  house_number: string;
  village: string;
  street: string;
  sub_street: string;

  province_id: number;
  Province?: ProvinceInterface;

  district_id: number;
  District?: DistrictInterface;

  subdistrict_id: number;
  Subdistrict?: SubDistrictInterface;

  postcode_id: number;
  Postcode?: PostcodeInterface;
}