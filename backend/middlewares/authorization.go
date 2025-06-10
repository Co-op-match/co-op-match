package middlewares

import (
	"net/http"

	"strings"

	"co-op-match.com/co-op-match/services"

	"github.com/gin-gonic/gin"
)


var HashKey = []byte("very-secret")

var BlockKey = []byte("a-lot-secret1234")

// Authorization เป็นฟังก์ชั่นตรวจเช็ค Cookie

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