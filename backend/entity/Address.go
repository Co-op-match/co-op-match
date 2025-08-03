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

		ProvinceID    uint      `json:"province_id"`
		Province      Provinces `gorm:"foreignKey:ProvinceID"`

		DistrictID    uint     `json:"district_id"`
		District      District `gorm:"foreignKey:DistrictID"`

		SubDistrictID uint         `json:"subdistrict_id"`
		SubDistrict   SubDistrict  `gorm:"foreignKey:SubDistrictID"`

		PostcodeID    uint     `json:"postcode_id"`
		Postcode      Postcode `gorm:"foreignKey:PostcodeID"`

		Student       []Student       `gorm:"foreignKey:AddressID"`
		AcademicStaff []AcademicStaff `gorm:"foreignKey:AddressID"`
		Company       []Company       `gorm:"foreignKey:AddressID"`
	}
