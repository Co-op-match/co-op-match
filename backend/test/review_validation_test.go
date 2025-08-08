package unit

import (
	"testing"

	"co-op-match.com/co-op-match/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestReviewValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	// 🟢 กรณีข้อมูลถูกต้อง
	t.Run("valid review", func(t *testing.T) {
		review := entity.Review{
			Rating:    4,
			Comment:   "ดีมากครับ",
			StudentID: 1,
			CompanyID: 1,
		}

		ok, err := govalidator.ValidateStruct(review)
		g.Expect(ok).To(BeTrue()) // ✅ ต้องผ่าน
		g.Expect(err).To(BeNil()) // ✅ ไม่มี error
	})

	// 🔴 กรณี Rating < 1
	t.Run("invalid rating too low", func(t *testing.T) {

		review := entity.Review{
			Rating:    -1,
			Comment:   "bad",
			StudentID: 1,
			CompanyID: 1,
		}

		ok, err := govalidator.ValidateStruct(review)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(Not(BeNil()))
		g.Expect(err.Error()).To(ContainSubstring("Rating must be between 1 and 5"))
	})

	// 🔴 กรณี Rating > 5
	t.Run("invalid rating too high", func(t *testing.T) {
		review := entity.Review{
			Rating:    6,
			Comment:   "เทพเกิน",
			StudentID: 1,
			CompanyID: 1,
		}

		ok, err := govalidator.ValidateStruct(review)
		g.Expect(ok).To(BeFalse()) // ❌ ต้องไม่ผ่าน
		g.Expect(err).To(Not(BeNil()))
		g.Expect(err.Error()).To(ContainSubstring("Rating must be between 1 and 5"))
	})

	// 🔴 กรณีไม่มี Comment
	t.Run("missing comment", func(t *testing.T) {
		review := entity.Review{
			Rating:    3,
			Comment:   "",
			StudentID: 1,
			CompanyID: 1,
		}

		ok, err := govalidator.ValidateStruct(review)
		g.Expect(ok).To(BeFalse()) // ❌ ต้องไม่ผ่าน
		g.Expect(err).To(Not(BeNil()))
		g.Expect(err.Error()).To(ContainSubstring("Comment is required"))
	})

	// // 🔴 กรณีไม่มี StudentID
	t.Run("missing student ID", func(t *testing.T) {
		review := entity.Review{
			Rating:    4,
			Comment:   "พอใช้ได้",
			StudentID: 0,
			CompanyID: 1,
		}

		ok, err := govalidator.ValidateStruct(review)
		g.Expect(ok).To(BeFalse()) // ❌ ต้องไม่ผ่าน
		g.Expect(err).To(Not(BeNil()))
		g.Expect(err.Error()).To(ContainSubstring("StudentID is required"))
	})

	// // 🔴 กรณีไม่มี CompanyID
	t.Run("missing company ID", func(t *testing.T) {
		review := entity.Review{
			Rating:    4,
			Comment:   "พอใช้ได้",
			StudentID: 1,
			CompanyID: 0,
		}

		ok, err := govalidator.ValidateStruct(review)
		g.Expect(ok).To(BeFalse()) // ❌ ต้องไม่ผ่าน
		g.Expect(err).To(Not(BeNil()))
		g.Expect(err.Error()).To(ContainSubstring("CompanyID is required"))
	})
}
