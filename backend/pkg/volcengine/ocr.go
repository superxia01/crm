package volcengine

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
)

// OCRClient OCR 客户端
type OCRClient struct {
	*VolcEngineClient
	AppID string
}

func NewOCRClient(accessKeyID, accessKeySecret, region, appID string) *OCRClient {
	return &OCRClient{
		VolcEngineClient: NewVolcEngineClient(accessKeyID, accessKeySecret, region),
		AppID:           appID,
	}
}

// BusinessCardRequest 名片识别请求
type BusinessCardRequest struct {
	Image []byte
}

// BusinessCardResult 名片识别结果
type BusinessCardResult struct {
	Name      string  `json:"name"`
	Company   string  `json:"company"`
	Position  string  `json:"position"`
	Phone     string  `json:"phone"`
	Email     string  `json:"email"`
	Address   string  `json:"address"`
	Confidence float64 `json:"confidence"`
}

// RecognizeBusinessCard 识别名片（使用通用 OCR + 结构化解析）
func (c *OCRClient) RecognizeBusinessCard(imageData []byte) (*BusinessCardResult, error) {
	// 将图片编码为 base64
	imageBase64 := base64.StdEncoding.EncodeToString(imageData)

	// 构造请求体
	requestBody := map[string]interface{}{
		"app_id":  c.AppID,
		"image":   imageBase64,
		"service": "BusinessCardScene", // 使用名片识别场景
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	// 构造查询参数
	query := url.Values{}
	query.Set("a_id", c.AppID)

	// 发送请求
	host := "visual.volcengineapi.com"
	path := "/api/v1/ocr/business_card"

	// 使用 multipart/form-data 上传
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("image", "image.jpg")
	if err != nil {
		return nil, err
	}

	_, err = part.Write(imageData)
	if err != nil {
		return nil, err
	}

	writer.WriteField("a_id", c.AppID)
	// writer.WriteField("service", "BusinessCardScene")

	contentType := writer.FormDataContentType()
	writer.Close()

	// 使用 HTTP 客户端直接发送
	reqURL := fmt.Sprintf("https://%s%s", host, path)
	req, err := http.NewRequest("POST", reqURL, body)
	if err != nil {
		return nil, err
	}

	// 设置火山引擎认证头
	timestamp := time.Now().Unix()
	signature := c.generateSignature("POST", path, "", timestamp)

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
		return nil, fmt.Errorf("OCR API error: %s", string(respBody))
	}

	// 解析响应
	var ocrResp struct {
		ErrorCode    int    `json:"code"`
		ErrorMsg     string `json:"msg"`
		LogID        string `json:"log_id"`
		Data         []struct {
			Name      string `json:"name"`
			Company   string `json:"company"`
			Position  string `json:"position"`
			Phone     string `json:"phone"`
			Email     string `json:"email"`
			Address   string `json:"address"`
		} `json:"data"`
	}

	if err := json.Unmarshal(respBody, &ocrResp); err != nil {
		return nil, err
	}

	if ocrResp.ErrorCode != 0 {
		return nil, fmt.Errorf("OCR error: %s (code: %d)", ocrResp.ErrorMsg, ocrResp.ErrorCode)
	}

	// 提取第一个结果（通常只返回一张名片）
	if len(ocrResp.Data) == 0 {
		return &BusinessCardResult{}, nil
	}

	card := ocrResp.Data[0]

	return &BusinessCardResult{
		Name:      card.Name,
		Company:   card.Company,
		Position:  card.Position,
		Phone:     card.Phone,
		Email:     card.Email,
		Address:   card.Address,
		Confidence: 0.90, // 默认置信度
	}, nil
}
