package handler

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/gin-gonic/gin"
	"github.com/xia/nextcrm/pkg/authcenter"
)

// WechatAuthHandler handles WeChat authentication via auth-center
type WechatAuthHandler struct {
	authCenterService *authcenter.Service
}

func NewWechatAuthHandler(authCenterService *authcenter.Service) *WechatAuthHandler {
	return &WechatAuthHandler{
		authCenterService: authCenterService,
	}
}

// WechatLogin initiates WeChat login by redirecting to auth-center
func (h *WechatAuthHandler) WechatLogin(c *gin.Context) {
	// Get callback URL from query or use default
	callbackURL := c.Query("callbackUrl")
	if callbackURL == "" {
		// Determine scheme from X-Forwarded-Proto header (for reverse proxy)
		scheme := "http"
		if proto := c.GetHeader("X-Forwarded-Proto"); proto != "" {
			scheme = proto
		} else if c.Request.TLS != nil {
			scheme = "https"
		}
		callbackURL = scheme + "://" + c.Request.Host + "/api/v1/auth/callback"
	}

	// Build auth-center URL
	authCenterURL := fmt.Sprintf(
		"%s/api/auth/wechat/login?callbackUrl=%s",
		"https://os.crazyaigc.com",
		url.QueryEscape(callbackURL),
	)

	// Handle HEAD requests by returning status without body
	if c.Request.Method == "HEAD" {
		c.Status(http.StatusFound)
		c.Header("Location", authCenterURL)
		return
	}

	// Redirect to auth-center
	c.Redirect(http.StatusFound, authCenterURL)
}

// AuthCallback handles the callback from auth-center
func (h *WechatAuthHandler) AuthCallback(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		if c.Request.Method == "HEAD" {
			c.Status(http.StatusFound)
			c.Header("Location", "/#/login?error=missing_token")
			return
		}
		c.Redirect(http.StatusFound, "/#/login?error=missing_token")
		return
	}

	// Handle HEAD requests by returning status without body
	if c.Request.Method == "HEAD" {
		c.Status(http.StatusFound)
		c.Header("Location", "/#/auth/callback?token="+token)
		return
	}

	// Redirect to frontend callback page with token (use hash for HashRouter)
	c.Redirect(http.StatusFound, "/#/auth/callback?token="+token)
}
