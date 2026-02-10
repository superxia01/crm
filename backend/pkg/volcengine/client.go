package volcengine

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// VolcEngineClient 火山引擎客户端
type VolcEngineClient struct {
	AccessKeyID     string
	AccessKeySecret string
	Region          string
	Endpoint        string
	httpClient      *http.Client
}

func NewVolcEngineClient(accessKeyID, accessKeySecret, region string) *VolcEngineClient {
	return &VolcEngineClient{
		AccessKeyID:     accessKeyID,
		AccessKeySecret: accessKeySecret,
		Region:          region,
		Endpoint:        "openspeech.bytedance.com",
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// generateSignature 生成火山引擎 API 签名
func (c *VolcEngineClient) generateSignature(method, queryPath, query string, timestamp int64) string {
	// 构造待签名字符串
 canonicalRequest := fmt.Sprintf("%s\n%s\n%s", method, queryPath, query)

	// 创建签名
	h := hmac.New(sha1.New, []byte(c.AccessKeySecret))
	h.Write([]byte(canonicalRequest))

	// Base64 编码
	signature := base64.StdEncoding.EncodeToString(h.Sum(nil))

	return signature
}

// doRequest 执行 HTTP 请求
func (c *VolcEngineClient) doRequest(host, path, query, contentType string, body io.Reader) ([]byte, error) {
	timestamp := time.Now().Unix()

	// 生成签名
	signature := c.generateSignature("POST", path, query, timestamp)

	// 构造完整 URL
	fullURL := fmt.Sprintf("https://%s%s?%s", host, path, query)

	// 创建请求
	req, err := http.NewRequest("POST", fullURL, body)
	if err != nil {
		return nil, err
	}

	// 设置请求头
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Authorization", c.AccessKeyID)
	req.Header.Set("X-Date", fmt.Sprintf("%d", timestamp))
	req.Header.Set("X-Signature", signature)

	// 发送请求
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error: %s", string(respBody))
	}

	return respBody, nil
}
