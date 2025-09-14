// services/jwt_wrapper.go
package services

import (
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JwtWrapper struct {
	SecretKey       string
	Issuer          string
	ExpirationHours int64
}

type JwtClaims struct {
	Email   string `json:"email,omitempty"`
	Role    string `json:"role,omitempty"`
	AdminID *uint  `json:"admin_id,omitempty"`
	jwt.RegisteredClaims
}

// แปลง sub -> userID (uint)
func (c *JwtClaims) UserID() (uint, error) {
	if c == nil || c.Subject == "" {
		return 0, errors.New("subject empty")
	}
	n, err := strconv.ParseUint(c.Subject, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(n), nil
}

// สร้าง token: แนบ userID (ใน sub), email, role และ (ถ้าเป็นแอดมิน) adminID
func (j *JwtWrapper) GenerateToken(userID uint, email string, role string, adminID *uint) (string, error) {
	now := time.Now()
	claims := &JwtClaims{
		Email:   email,
		Role:    role,
		AdminID: adminID, // nil ได้
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", userID),                                // sub = userID
			Issuer:    j.Issuer,                                                 // iss
			IssuedAt:  jwt.NewNumericDate(now),                                  // iat
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Hour * time.Duration(j.ExpirationHours))), // exp
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(j.SecretKey))
}

// ตรวจ token
func (j *JwtWrapper) ValidateToken(signedToken string) (*JwtClaims, error) {
	parser := jwt.NewParser(jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	token, err := parser.ParseWithClaims(
		signedToken,
		&JwtClaims{},
		func(t *jwt.Token) (interface{}, error) {
			return []byte(j.SecretKey), nil
		},
	)
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JwtClaims)
	if !ok || !token.Valid {
		return nil, errors.New("couldn't parse claims or token invalid")
	}

	// หมดอายุ
	if claims.ExpiresAt == nil || time.Now().After(claims.ExpiresAt.Time) {
		return nil, errors.New("JWT is expired")
	}
	// ตรวจ issuer (ถ้าตั้งค่าไว้)
	if j.Issuer != "" && claims.Issuer != j.Issuer {
		return nil, errors.New("invalid issuer")
	}
	return claims, nil
}



/*package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JwtWrapper struct {
	SecretKey       string
	Issuer          string
	ExpirationHours int64
}

type JwtClaims struct {
	Email   string `json:"email,omitempty"`
	jwt.RegisteredClaims
}

func (j *JwtClaims) UserID() (any, any) {
	panic("unimplemented")
}

// สร้าง token: ใส่ userID ลงใน Subject (sub) + แนบ email ไว้ด้วย
func (j *JwtWrapper) GenerateToken(userID uint, email string) (string, error) {
	now := time.Now()
	claims := &JwtClaims{
		Email: email,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:  fmt.Sprintf("%d", userID), // sub = userID
			Issuer:   j.Issuer,                  // iss
			IssuedAt: jwt.NewNumericDate(now),   // iat
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Hour * // exp
				time.Duration(j.ExpirationHours))),
		},
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString([]byte(j.SecretKey))
}

// ตรวจ token: ทำให้ “เข้ม” เหมือนเวอร์ชันเก่า
func (j *JwtWrapper) ValidateToken(signedToken string) (*JwtClaims, error) {
	parser := jwt.NewParser(
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
	)

	token, err := parser.ParseWithClaims(
		signedToken,
		&JwtClaims{},
		func(t *jwt.Token) (interface{}, error) {
			return []byte(j.SecretKey), nil
		},
	)
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JwtClaims)
	if !ok || !token.Valid {
		return nil, errors.New("couldn't parse claims or token invalid")
	}

	// ====== ตรวจหมดอายุแบบของเดิม ======
	if claims.ExpiresAt == nil || time.Now().After(claims.ExpiresAt.Time) {
		return nil, errors.New("JWT is expired")
	}

	// (ทางเลือก) ตรวจ issuer ให้ตรง
	if j.Issuer != "" && claims.Issuer != j.Issuer {
		return nil, errors.New("invalid issuer")
	}

	return claims, nil
}
*/