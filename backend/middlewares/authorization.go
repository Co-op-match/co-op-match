package middlewares

import (
	"net/http"

	"strings"

	"co-op-match.com/co-op-match/services"

	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

var HashKey = []byte("very-secret")

var BlockKey = []byte("a-lot-secret1234")

// Authorization เป็นฟังก์ชั่นตรวจเช็ค Cookie
func AuthorizeWithCookie() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr, err := c.Cookie("auth_token")
		if err != nil || tokenStr == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing auth_token cookie"})
			return
		}

		jwtWrapper := services.JwtWrapper{
			SecretKey: "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
			Issuer:    "AuthService",
		}

		_, err = jwtWrapper.ValidateToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		c.Next()
	}
}
func Authorizes() gin.HandlerFunc {

	return func(c *gin.Context) {

		clientToken := c.Request.Header.Get("Authorization")

		if clientToken == "" {

			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "No Authorization header provided"})

			return

		}

		extractedToken := strings.Split(clientToken, "Bearer ")

		if len(extractedToken) == 2 {

			clientToken = strings.TrimSpace(extractedToken[1])

		} else {

			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Incorrect Format of Authorization Token"})

			return

		}

		jwtWrapper := services.JwtWrapper{

			SecretKey: "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",

			Issuer: "AuthService",
		}

		_, err := jwtWrapper.ValidateToken(clientToken)

		if err != nil {

			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})

			return

		}

		c.Next()

	}

}

// middleware/ratelimit.go

type bucket struct {
	last  time.Time
	count int
}

var rlMu sync.Mutex
var emailBuckets = map[string]*bucket{} // key = email
var ipBuckets = map[string]*bucket{}    // key = ip

func RateLimitForgotPassword() gin.HandlerFunc {
	return func(c *gin.Context) {
		email := c.PostForm("email")
		if email == "" {
			var body struct {
				Email string `json:"email"`
			}
			_ = c.ShouldBindJSON(&body)
			email = body.Email
		}
		ip := c.ClientIP()

		// config
		window := time.Minute
		maxPerWindow := 3

		rlMu.Lock()
		defer rlMu.Unlock()

		now := time.Now()
		check := func(m map[string]*bucket, k string) bool {
			b, ok := m[k]
			if !ok || now.Sub(b.last) > window {
				m[k] = &bucket{last: now, count: 1}
				return true
			}
			if b.count >= maxPerWindow {
				return false
			}
			b.count++
			b.last = now
			return true
		}

		if email != "" && !check(emailBuckets, email) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": true, "message": "ขอรีเซ็ตบ่อยเกินไป ลองใหม่ภายหลัง"})
			c.Abort()
			return
		}
		if !check(ipBuckets, ip) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": true, "message": "ขอรีเซ็ตบ่อยเกินไป ลองใหม่ภายหลัง"})
			c.Abort()
			return
		}

		c.Next()
	}
}
