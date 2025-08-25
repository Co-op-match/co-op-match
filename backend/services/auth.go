// services/jwt_wrapper.go
package services

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
	Email string `json:"email,omitempty"`
	jwt.RegisteredClaims
}

// สร้าง token: ใส่ userID ลงใน Subject (sub) + แนบ email ไว้ด้วย
func (j *JwtWrapper) GenerateToken(userID uint, email string) (string, error) {
	now := time.Now()
	claims := &JwtClaims{
		Email: email,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", userID),                // sub = userID
			Issuer:    j.Issuer,                                 // iss
			IssuedAt:  jwt.NewNumericDate(now),                  // iat
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Hour *    // exp
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
