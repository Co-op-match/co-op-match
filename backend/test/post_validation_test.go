// unit/intership_post_validation_test.go
package unit

import (
	"testing"

	"co-op-match.com/co-op-match/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestIntershipPostValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	makeValid := func() entity.IntershipPost {
		return entity.IntershipPost{
			PostName:        "Frontend Developer Intern",
			PostDescription: "พัฒนา UI ด้วย React + Ant Design และทำงานร่วมกับทีมพี่เลี้ยง",
			Quantity:        3,
			MinGpa:          2.50,
			LocationDetail:  "อาคาร A ชั้น 10",
			Subdistrict:     "บางรัก",
			District:        "บางรัก",
			Province:        "กรุงเทพมหานคร",
			CompanyID:       1,
			JobTypeID:       1,
			StipendID:       1,
			WorkDayID:       1,
			WorkModeID:      1,
			StatusPostID:    1,
			AdminID:         1,
		}
	}

	t.Run("valid intership post", func(t *testing.T) {
		post := makeValid()
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// ----- Text fields -----
	t.Run("missing PostName", func(t *testing.T) {
		post := makeValid()
		post.PostName = ""
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("PostName is required"))
	})

	t.Run("PostName too short (<3)", func(t *testing.T) {
		post := makeValid()
		post.PostName = "UI" // 2 ตัวอักษร
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("PostName must be 3-100 characters"))
	})

	t.Run("missing PostDescription", func(t *testing.T) {
		post := makeValid()
		post.PostDescription = ""
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("PostDescription is required"))
	})

	t.Run("PostDescription too short (<10)", func(t *testing.T) {
		post := makeValid()
		post.PostDescription = "สั้นมาก"
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("PostDescription must be 10-5000 characters"))
	})

	t.Run("Quantity negative", func(t *testing.T) {
		post := makeValid()
		post.Quantity = -5
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("Quantity must be between 1 and 1000"))
	})

	t.Run("MinGpa below 0", func(t *testing.T) {
		post := makeValid()
		post.MinGpa = -0.1
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("MinGpa must be between 0.00 and 4.00"))
	})

	t.Run("MinGpa above 4", func(t *testing.T) {
		post := makeValid()
		post.MinGpa = 4.5
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("MinGpa must be between 0.00 and 4.00"))
	})

	// ----- Location -----
	t.Run("missing LocationDetail", func(t *testing.T) {
		post := makeValid()
		post.LocationDetail = ""
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("LocationDetail is required"))
	})

	t.Run("missing Subdistrict", func(t *testing.T) {
		post := makeValid()
		post.Subdistrict = ""
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("Subdistrict is required"))
	})

	t.Run("missing District", func(t *testing.T) {
		post := makeValid()
		post.District = ""
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("District is required"))
	})

	t.Run("missing Province", func(t *testing.T) {
		post := makeValid()
		post.Province = ""
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("Province is required"))
	})

	// ----- Foreign Keys -----
	t.Run("missing CompanyID", func(t *testing.T) {
		post := makeValid()
		post.CompanyID = 0
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("CompanyID is required"))
	})

	t.Run("missing JobTypeID", func(t *testing.T) {
		post := makeValid()
		post.JobTypeID = 0
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("JobTypeID is required"))
	})

	t.Run("missing StipendID", func(t *testing.T) {
		post := makeValid()
		post.StipendID = 0
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("StipendID is required"))
	})

	t.Run("missing WorkDayID", func(t *testing.T) {
		post := makeValid()
		post.WorkDayID = 0
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("WorkDayID is required"))
	})

	t.Run("missing WorkModeID", func(t *testing.T) {
		post := makeValid()
		post.WorkModeID = 0
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("WorkModeID is required"))
	})

	t.Run("missing StatusPostID", func(t *testing.T) {
		post := makeValid()
		post.StatusPostID = 0
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("StatusPostID is required"))
	})

	t.Run("missing AdminID", func(t *testing.T) {
		post := makeValid()
		post.AdminID = 0
		ok, err := govalidator.ValidateStruct(post)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("AdminID is required"))
	})
}
