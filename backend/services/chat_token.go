// services/chat_token.go
package services

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type ChatClaims struct {
	Rid uint `json:"rid"` // room id (0 = lobby)
	jwt.RegisteredClaims
}

type ChatToken struct {
	Secret string
	TTL    time.Duration
}

func (ct ChatToken) Mint(userID uint, roomID uint) (string, error) {
	now := time.Now()
	claims := ChatClaims{
		Rid: roomID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", userID), // sub = user id
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ct.TTL)),
			ID:        uuid.NewString(), // jti
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(ct.Secret))
}

func (ct ChatToken) Parse(tokenStr string) (*ChatClaims, error) {
	t, err := jwt.ParseWithClaims(tokenStr, &ChatClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(ct.Secret), nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := t.Claims.(*ChatClaims); ok && t.Valid {
		return claims, nil
	}
	return nil, fmt.Errorf("invalid token")
}
