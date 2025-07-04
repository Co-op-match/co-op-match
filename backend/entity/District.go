package entity

import (
	"gorm.io/gorm"
)

type District struct {
	gorm.Model
	NameTH     string    `json:"name_th"`
	NameEN     string    `json:"name_en"`
	ProvinceID uint      `json:"province_id"`
	Province   Provinces `gorm:"foreignKey:ProvinceID"`
	SubDistricts []SubDistrict `gorm:"foreignKey:DistrictID"`
	Addresses []Address `gorm:"foreignKey:DistrictID"`
}
