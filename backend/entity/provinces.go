package entity

import "gorm.io/gorm"

type Provinces struct {
	gorm.Model
	NameTH   string     `json:"name_th"`
	NameEN   string     `json:"name_en"`
	Districts []District `gorm:"foreignKey:ProvinceID"`
	Addresses []Address `gorm:"foreignKey:ProvinceID"`
}
