package controller

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"co-op-match.com/co-op-match/config"
	"co-op-match.com/co-op-match/entity"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

func GetAllAdmin(c *gin.Context) {
	var admin []entity.Admin

	err := config.DB().
		Preload("IntershipPost").
		Preload("User").
		Preload("User.Role").
		Find(&admin).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to fetch admin",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, admin)
}

func GetAdminByID(c *gin.Context) {
	id := c.Param("id")
	var admin entity.Admin

	if err := config.DB().
		Preload("IntershipPost").
		Preload("User").
		First(&admin, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, admin)
}

func GetAdminByUserID(c *gin.Context) {
	id := c.Param("id") // UserID ที่ส่งเข้ามา

	var admin entity.Admin

	if err := config.DB().
		Preload("IntershipPost").
		Preload("User").
		Where("user_id = ?", id).
		First(&admin).Error; err != nil {

		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Admin not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, admin)
}

/*==========================  Intership Post input Admin  ==========================*/
func GetAllInternshipPostsInAdmin(c *gin.Context) {
	var posts []entity.IntershipPost

	err := config.DB().
		Preload("Company").
		Preload("Company.User.Role").
		Preload("Company.Address.Province").
		Preload("Company.Address.District").
		Preload("Company.Address.SubDistrict.Postcode").
		Preload("Company.Contact").
		Preload("JobType").
		Preload("Stipend").
		Preload("WorkDay").
		Preload("WorkMode").
		Preload("StatusPost").
		Preload("Benefits").
		Preload("Applications.Student").
		Find(&posts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "ไม่สามารถดึงข้อมูลโพสต์ฝึกงานได้",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, posts)
}

func GetInternshipPostsInAdminByIPostID(c *gin.Context) {
	id := c.Param("id") // รับ post id จาก URL param

	var post entity.IntershipPost

	err := config.DB().
		Preload("Company").
		Preload("Company.User.Role").
		Preload("Company.Address.Province").
		Preload("Company.Address.District").
		Preload("Company.Address.SubDistrict.Postcode").
		Preload("Company.Contact").
		Preload("JobType").
		Preload("Stipend").
		Preload("WorkDay").
		Preload("WorkMode").
		Preload("StatusPost").
		Preload("Benefits").
		Preload("Applications.Student.Education").
		First(&post, id).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "ไม่พบโพสต์ฝึกงาน",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, post)
}

// =======================   Create Admin   ===============================
type CreateAdminInput struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Birthday  string `json:"birthday" binding:"required"`
	IsActive  *bool  `json:"is_active"` // optional, default=true
	Role      string `json:"role"`
	ImageURL  string `json:"image_url"`
}

func CreateAdmin(c *gin.Context) {
    db := config.DB()

    var input CreateAdminInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    normalizedEmail := strings.ToLower(strings.TrimSpace(input.Email))

    // role Admin
    var role entity.Role
    if err := db.Where("role_name = ?", input.Role).First(&role).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบข้อมูลบทบาทผู้ใช้"})
        return
    }

    // duplicate email?
    var exists entity.User
    if err := db.Where("email = ?", normalizedEmail).First(&exists).Error; err == nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "อีเมลนี้เคยถูกใช้แล้ว"})
        return
    }

    // birthday
    bday, err := parseBirthdayInAdmin(input.Birthday)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // ตรวจ path (แค่ validate — ไม่แตะไฟล์)
    imgPath, err := sanitizeUploadPath(input.ImageURL)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    var createdUser entity.User
    var createdAdmin entity.Admin
    var createdProfile *entity.ProfileImage

    err = db.Transaction(func(tx *gorm.DB) error {
        // User
        hash, _ := config.HashPassword(input.Password)
        active := true
        if input.IsActive != nil {
            active = *input.IsActive
        }
        u := entity.User{
            Email:      normalizedEmail,
            Password:   hash,
            RoleID:     role.ID,
            IsActive:   active,
            IsLoggedIn: false,
        }
        if err := tx.Create(&u).Error; err != nil {
            return err
        }
        createdUser = u

        // Admin
        a := entity.Admin{
            FirstName: input.FirstName,
            LastName:  input.LastName,
            Birthday:  bday,
            UserID:    u.ID,
        }
        if err := tx.Create(&a).Error; err != nil {
            return err
        }
        createdAdmin = a

        // ProfileImage (ถ้าให้มา)
        if imgPath != "" {
            p := entity.ProfileImage{
                ImageURL: imgPath, // เก็บ path ตรง ๆ
                UserID:   u.ID,
            }
            if err := tx.Create(&p).Error; err != nil {
                return err
            }
            createdProfile = &p
        }
        return nil
    })
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // response
    resp := gin.H{
        "user_id":    createdUser.ID,
        "email":      createdUser.Email,
        "admin_id":   createdAdmin.ID,
        "first_name": createdAdmin.FirstName,
        "last_name":  createdAdmin.LastName,
        "birthday":   createdAdmin.Birthday,
        "is_active":  createdUser.IsActive,
        "role_name":  "Admin",
        "created_at": createdAdmin.CreatedAt,
    }
    if createdProfile != nil {
        resp["image_url"] = createdProfile.ImageURL
    }
    c.JSON(http.StatusCreated, gin.H{
        "message": "สร้างแอดมินสำเร็จ",
        "data":    resp,
    })
}

// =============================     helper    ======================================
func parseBirthdayInAdmin(s string) (time.Time, error) {
	layouts := []string{time.RFC3339, "2006-01-02"}
	for _, ly := range layouts {
		if t, err := time.Parse(ly, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, errors.New("invalid birthday format")
}

// ===== helper: ตรวจสอบความถูกต้องของ path =====
func sanitizeUploadPath(p string) (string, error) {
    p = strings.TrimSpace(p)
    if p == "" {
        return "", nil // อนุญาตเว้นว่าง
    }
    if !strings.HasPrefix(p, "/uploads/") {
        return "", errors.New("image_url must start with /uploads/")
    }
    if strings.Contains(p, "..") {
        return "", errors.New("invalid image_url")
    }
    ext := strings.ToLower(filepath.Ext(p))
    switch ext {
    case ".png", ".jpg", ".jpeg", ".webp", ".gif":
        return p, nil
    default:
        return "", errors.New("unsupported image extension")
    }
}

func UploadImageByAdmin(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please upload a file"})
		return
	}

	uploadDir := "public/uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create upload directory"})
			return
		}
	}

	// ตั้งชื่อไฟล์ตาม timestamp + ชื่อเดิม
	origName := fmt.Sprintf("%s-%s",
		time.Now().In(time.FixedZone("Asia/Bangkok", 7*60*60)).Format("20060102-150405"),
		file.Filename,
	)

	// ถ้าชน ให้หาไฟล์ชื่อใหม่ที่ไม่ซ้ำ
	safeName, err := NextAvailableFilename(uploadDir, origName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "unable to pick unique filename"})
		return
	}

	absPath := filepath.Join(uploadDir, safeName)
	relPath := "/uploads/" + safeName

	if err := c.SaveUploadedFile(file, absPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save the file"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":    "success",
		"image_url": relPath,
	})
}

// NextAvailableFilename ตรวจว่ามีไฟล์ชื่อนี้ในไดเรกทอรีหรือยัง
// ถ้ามีแล้ว จะคืนชื่อที่เติม _1, _2, ... จนกว่าจะว่าง
func NextAvailableFilename(dir, filename string) (string, error) {
	ext := filepath.Ext(filename)
	name := strings.TrimSuffix(filename, ext)

	// ถ้าไม่ชน ก็ใช้ชื่อเดิม
	if _, err := os.Stat(filepath.Join(dir, filename)); os.IsNotExist(err) {
		return filename, nil
	}

	// ถ้าชน ให้ไล่หา _1, _2, ...
	for i := 1; ; i++ {
		candidate := fmt.Sprintf("%s_%d%s", name, i, ext)
		if _, err := os.Stat(filepath.Join(dir, candidate)); os.IsNotExist(err) {
			return candidate, nil
		}
	}
}