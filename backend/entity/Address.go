package entity

import (
	"gorm.io/gorm"
)

type Address struct {
	gorm.Model
	HouseNumber string `json:"house_number"`
	Village     string `json:"village"`
	Street      string `json:"street"`
	SubStreet   string `json:"sub_street"`
	Subdistrict string `json:"subdistrict"`
	District    string `json:"district"`
	Province    string `json:"province"`

	Student       []Student       `gorm:"foreignKey:AddressID"`
	AcademicStaff []AcademicStaff `gorm:"foreignKey:AddressID"`
	Company       []Company       `gorm:"foreignKey:AddressID"`
}
