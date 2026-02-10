package authcenter

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	DefaultBaseURL = "https://os.crazyaigc.com"
)

// Config holds auth-center configuration
type Config struct {
	BaseURL string
}

// Service handles auth-center API interactions
type Service struct {
	baseURL    string
	httpClient *http.Client
}

// NewService creates a new auth-center service
func NewService(cfg *Config) *Service {
	if cfg == nil {
		cfg = &Config{BaseURL: DefaultBaseURL}
	}
	return &Service{
		baseURL: cfg.BaseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// VerifyTokenResponse represents the response from verify-token endpoint
type VerifyTokenResponse struct {
	Success bool   `json:"success"`
	Data    struct {
		UnionID string `json:"unionId"`
		UserID  string `json:"userId"`
	} `json:"data"`
	Error string `json:"error"`
}

// VerifyToken verifies a JWT token with auth-center
func (s *Service) VerifyToken(token string) (bool, string, error) {
	url := fmt.Sprintf("%s/api/auth/verify-token", s.baseURL)

	reqBody := map[string]string{
		"token": token,
	}
	jsonBody, _ := json.Marshal(reqBody)

	resp, err := s.httpClient.Post(url, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return false, "", fmt.Errorf("请求 auth-center 失败: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result VerifyTokenResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return false, "", fmt.Errorf("解析响应失败: %w", err)
	}

	if !result.Success {
		return false, "", fmt.Errorf("token 无效: %s", result.Error)
	}

	return true, result.Data.UserID, nil
}

// UserInfoResponse represents the response from user-info endpoint
type UserInfoResponse struct {
	Success bool `json:"success"`
	Data    struct {
		UserID      string `json:"userId"`
		UnionID     string `json:"unionId"`
		PhoneNumber string `json:"phoneNumber"`
		Email       string `json:"email"`
		CreatedAt   string `json:"createdAt"`
		LastLoginAt string `json:"lastLoginAt"`
		Profile     struct {
			Nickname  string `json:"nickname"`
			AvatarURL string `json:"avatarUrl"`
		} `json:"profile"`
		Accounts []struct {
			Provider  string `json:"provider"`
			Type      string `json:"type"`
			Nickname  string `json:"nickname"`
			AvatarURL string `json:"avatarUrl"`
			CreatedAt string `json:"createdAt"`
		} `json:"accounts"`
	} `json:"data"`
	Error string `json:"error"`
}

// GetUserInfo retrieves user information using a token
func (s *Service) GetUserInfo(token string) (*UserInfoResponse, error) {
	url := fmt.Sprintf("%s/api/auth/user-info", s.baseURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("请求 auth-center 失败: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result UserInfoResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("解析响应失败: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("获取用户信息失败: %s", result.Error)
	}

	return &result, nil
}
