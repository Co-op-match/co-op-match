// unit/interview_appointment_validation_test.go
package unit

import (
	"testing"
	"time"

	"co-op-match.com/co-op-match/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestInterviewAppointmentValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	makeValid := func() entity.InterviewAppointment {
		return entity.InterviewAppointment{
			AppointmentDate: time.Now().Add(24 * time.Hour), // อนาคต 1 วัน
			Mode:            "online",
			Details:         "สัมภาษณ์ผ่าน Google Meet ใช้เวลาประมาณ 45 นาที",
			CompanyID:       1,
			StudentID:       1,
		}
	}

	t.Run("valid appointment", func(t *testing.T) {
		ap := makeValid()
		ok, err := govalidator.ValidateStruct(ap)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	// ----- AppointmentDate -----
	t.Run("missing appointment date", func(t *testing.T) {
		ap := makeValid()
		ap.AppointmentDate = time.Time{} // zero time
		ok, err := govalidator.ValidateStruct(ap)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("AppointmentDate is required"))
	})

	// ----- Mode -----
	t.Run("missing mode", func(t *testing.T) {
		ap := makeValid()
		ap.Mode = ""
		ok, err := govalidator.ValidateStruct(ap)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("Mode is required"))
	})

	t.Run("invalid mode value", func(t *testing.T) {
		ap := makeValid()
		ap.Mode = "telepathy"
		ok, err := govalidator.ValidateStruct(ap)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("Mode must be one of online|onsite|hybrid"))
	})

	// ----- Details -----
	t.Run("missing details", func(t *testing.T) {
		ap := makeValid()
		ap.Details = ""
		ok, err := govalidator.ValidateStruct(ap)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("Details is required"))
	})

	t.Run("details too short", func(t *testing.T) {
		ap := makeValid()
		ap.Details = "สั้น"
		ok, err := govalidator.ValidateStruct(ap)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("Details must be 5-2000 characters"))
	})

	// ----- Foreign keys -----
	t.Run("missing company id", func(t *testing.T) {
		ap := makeValid()
		ap.CompanyID = 0
		ok, err := govalidator.ValidateStruct(ap)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("CompanyID is required"))
	})

	t.Run("missing student id", func(t *testing.T) {
		ap := makeValid()
		ap.StudentID = 0
		ok, err := govalidator.ValidateStruct(ap)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("StudentID is required"))
	})
}
