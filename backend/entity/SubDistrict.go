package entity

import "gorm.io/gorm"

type SubDistrict struct {
	gorm.Model
	NameTH     string   `json:"name_th"`
	NameEN     string   `json:"name_en"`
	DistrictID uint     `json:"district_id"`
	District   District `gorm:"foreignKey:DistrictID"`
	PostcodeID uint     `json:"postcode_id"`
	Postcode   Postcode `gorm:"foreignKey:PostcodeID"`
}
