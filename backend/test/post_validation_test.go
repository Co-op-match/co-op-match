package unit

import (
	"testing"

	"co-op-match.com/co-op-match/entity" // เปลี่ยนเป็น path ของคุณจริง ๆ
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestIntershipPostValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	// ✅ กรณีถูกต้อง
	// t.Run("valid intership post", func(t *testing.T) {
	// 	post := entity.IntershipPost{
	// 		PostName:        "Fullstack Developer",
	// 		PostDescription: "Build frontend and backend systems",
	// 		Quantity:        5,
	// 		MinGpa:          2.50,
	// 		LocationDetail:  "123 Co-working space",
	// 		Subdistrict:     "แขวงห้วยขวาง",
	// 		District:        "ห้วยขวาง",
	// 		Province:        "กรุงเทพมหานคร",
	// 		CompanyID:       1,
	// 		JobTypeID:       1,
	// 		StipendID:       1,
	// 		WorkDayID:       1,
	// 		WorkModeID:      1,
	// 		StatusPostID:    1,
	// 		AdminID:         1,
	// 	}

	// 	ok, err := govalidator.ValidateStruct(post)
	// 	g.Expect(ok).To(BeTrue())
	// 	g.Expect(err).To(BeNil())
	// })

	// ❌ จำนวนที่เปิดรับ = 0
	t.Run("invalid quantity - zero", func(t *testing.T) {
		post := entity.IntershipPost{
			PostName:        "Backend Developer",
			PostDescription: "Develop APIs",
			Quantity:        -1,
			MinGpa:          2.50,
			LocationDetail:  "123 Office",
			Subdistrict:     "ดินแดง",
			District:        "ดินแดง",
			Province:        "กรุงเทพ",
			CompanyID:       1,
			JobTypeID:       1,
			StipendID:       1,
			WorkDayID:       1,
			WorkModeID:      1,
			StatusPostID:    1,
			AdminID:         1,
		}

		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(Not(BeNil()))
		g.Expect(err.Error()).To(ContainSubstring("min=1"))
	})

	// ❌ GPA น้อยเกินไป
	// t.Run("invalid GPA - too low", func(t *testing.T) {
	// 	post := entity.IntershipPost{
	// 		PostName:        "Data Analyst",
	// 		PostDescription: "Analyze data trends",
	// 		Quantity:        3,
	// 		MinGpa:          0.00,
	// 		LocationDetail:  "456 Lab",
	// 		Subdistrict:     "บางนา",
	// 		District:        "บางนา",
	// 		Province:        "กรุงเทพ",
	// 		CompanyID:       1,
	// 		JobTypeID:       1,
	// 		StipendID:       1,
	// 		WorkDayID:       1,
	// 		WorkModeID:      1,
	// 		StatusPostID:    1,
	// 		AdminID:         1,
	// 	}

	// 	ok, err := govalidator.ValidateStruct(post)
	// 	g.Expect(ok).To(BeFalse())
	// 	g.Expect(err).To(Not(BeNil()))
	// 	g.Expect(err.Error()).To(ContainSubstring("GPA must be between 0.01 and 4.00"))
	// })

	// ❌ GPA มากเกินไป
	// t.Run("invalid GPA - too high", func(t *testing.T) {
	// 	post := entity.IntershipPost{
	// 		PostName:        "Mobile Developer",
	// 		PostDescription: "Build Android apps",
	// 		Quantity:        2,
	// 		MinGpa:          4.50,
	// 		LocationDetail:  "789 DevHub",
	// 		Subdistrict:     "ปทุมวัน",
	// 		District:        "ปทุมวัน",
	// 		Province:        "กรุงเทพ",
	// 		CompanyID:       1,
	// 		JobTypeID:       1,
	// 		StipendID:       1,
	// 		WorkDayID:       1,
	// 		WorkModeID:      1,
	// 		StatusPostID:    1,
	// 		AdminID:         1,
	// 	}

	// 	ok, err := govalidator.ValidateStruct(post)
	// 	g.Expect(ok).To(BeFalse())
	// 	g.Expect(err).To(Not(BeNil()))
	// 	g.Expect(err.Error()).To(ContainSubstring("GPA must be between 0.01 and 4.00"))
	// })

	// ❌ ขาด PostName
	// 	t.Run("missing PostName", func(t *testing.T) {
	// 		post := entity.IntershipPost{
	// 			PostDescription: "Build backend",
	// 			Quantity:        1,
	// 			MinGpa:          2.50,
	// 			LocationDetail:  "123 Place",
	// 			Subdistrict:     "ห้วยขวาง",
	// 			District:        "ห้วยขวาง",
	// 			Province:        "กรุงเทพ",
	// 			CompanyID:       1,
	// 			JobTypeID:       1,
	// 			StipendID:       1,
	// 			WorkDayID:       1,
	// 			WorkModeID:      1,
	// 			StatusPostID:    1,
	// 			AdminID:         1,
	// 		}

	//		ok, err := govalidator.ValidateStruct(post)
	//		g.Expect(ok).To(BeFalse())
	//		g.Expect(err).To(Not(BeNil()))
	//		g.Expect(err.Error()).To(ContainSubstring("Post name is required"))
	//	})
}
