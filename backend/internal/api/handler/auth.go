package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/xia/nextcrm/pkg/authcenter"
	"github.com/xia/nextcrm/pkg/utils"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	authCenterService *authcenter.Service
}

func NewAuthHandler(authCenterService *authcenter.Service) *AuthHandler {
	return &AuthHandler{
		authCenterService: authCenterService,
	}
}

// GetMe retrieves current user information using auth-center token
func (h *AuthHandler) GetMe(c *gin.Context) {
	// Get token from Authorization header
	token := c.GetHeader("Authorization")
	if token == "" {
		utils.SendError(c, http.StatusUnauthorized, "未提供认证令牌")
		return
	}

	// Remove "Bearer " prefix
	if len(token) > 7 && token[:7] == "Bearer " {
		token = token[7:]
	}

	// Get user info from auth-center
	userInfo, err := h.authCenterService.GetUserInfo(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"error":   "获取用户信息失败: " + err.Error(),
		})
		return
	}

	// Transform auth-center user info to app format
	response := map[string]interface{}{
		"id":          userInfo.Data.UserID,
		"userId":      userInfo.Data.UserID,
		"email":       userInfo.Data.Email,
		"phoneNumber": userInfo.Data.PhoneNumber,
		"nickname":    userInfo.Data.Profile.Nickname,
		"avatarUrl":   userInfo.Data.Profile.AvatarURL,
		"createdAt":   userInfo.Data.CreatedAt,
		"lastLoginAt": userInfo.Data.LastLoginAt,
	}

	utils.SendSuccess(c, response)
}
