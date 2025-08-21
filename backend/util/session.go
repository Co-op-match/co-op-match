package util

import (
	"crypto/rand"
	"encoding/hex"
)

func NewSessionID(n int) (string, error) {
	if n <= 0 {
		n = 16 // 16 bytes = 32 hex chars
	}
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
