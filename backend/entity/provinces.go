package entity

import "gorm.io/gorm"

type Provinces struct {
	gorm.Model
	Province string `json:"province"`
}
