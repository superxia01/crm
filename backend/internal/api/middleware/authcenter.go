package middleware

import (
	"fmt"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/xia/nextcrm/internal/repository"
	"github.com/xia/nextcrm/pkg/authcenter"
)

// AuthCenterMiddleware handles authentication using auth-center tokens
func AuthCenterMiddleware(authService *authcenter.Service, userRepo *repository.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Get token (priority: Header > Query > Cookie)
		token := c.GetHeader("Authorization")
		if token == "" {
			token = c.Query("token")
		} else {
			// Remove "Bearer " prefix
			token = strings.TrimPrefix(token, "Bearer ")
		}

		if token == "" {
			c.JSON(401, gin.H{"error": "未登录"})
			c.Abort()
			return
		}

		// 2. Verify token with auth-center
		valid, authCenterUserID, err := authService.VerifyToken(token)
		if err != nil || !valid {
			c.JSON(401, gin.H{"error": "token验证失败"})
			c.Abort()
			return
		}

		// 3. Get user info from auth-center (optional, can use cached data)
		userInfo, err := authService.GetUserInfo(token)
		if err != nil {
			// Log error but continue - we might have cached user data
			fmt.Printf("Warning: Failed to get user info from auth-center: %v\n", err)
		}

		// 4. Find or create local user
		user, err := userRepo.FindByAuthCenterUserID(authCenterUserID)
		if err != nil {
			// New user: create from auth-center data
			if userInfo != nil {
				user, err = userRepo.FindOrCreateByAuthCenter(
					authCenterUserID,
					userInfo.Data.UnionID,
					userInfo.Data.Profile.Nickname,
					userInfo.Data.Profile.AvatarURL,
				)
			} else {
				// Fallback: create minimal user
				user, err = userRepo.FindOrCreateByAuthCenter(
					authCenterUserID,
					"",
					"用户",
					"",
				)
			}
			if err != nil {
				c.JSON(500, gin.H{"error": "创建本地用户失败"})
				c.Abort()
				return
			}
		}

		// 5. Store user info in context
		c.Set("user", user)
		c.Set("authCenterUserID", authCenterUserID)
		c.Set("authCenterToken", token)

		// Also set user_id for backward compatibility (convert to uint64)
		c.Set("user_id", uint64(user.ID))

		c.Next()
	}
}

// GetAuthCenterUserID retrieves auth center user ID from context (helper function)
func GetAuthCenterUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("authCenterUserID")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

// GetUser retrieves full user object from context (helper function)
func GetUser(c *gin.Context) (*interface{}, bool) {
	user, exists := c.Get("user")
	if !exists {
		return nil, false
	}
	return &user, true
}
