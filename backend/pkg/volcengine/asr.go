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
	"time"
)

// ASRClient 语音识别客户端
type ASRClient struct {
	*VolcEngineClient
	AppID string
	UID   string
}

func NewASRClient(accessKeyID, accessKeySecret, region, appID, uid string) *ASRClient {
	return &ASRClient{
		VolcEngineClient: NewVolcEngineClient(accessKeyID, accessKeySecret, region),
		AppID:           appID,
		UID:             uid,
	}
}

// SpeechRecognitionRequest 语音识别请求
type SpeechRecognitionRequest struct {
	Audio         []byte `json:"audio"`
	AudioFormat   string `json:"audio_format"`
	Language      string `json:"language"`
	EnablePunctuation bool `json:"enable_punctuation"`
}

// SpeechRecognitionResponse 语音识别响应
type SpeechRecognitionResponse struct {
	ErrorCode    int    `json:"error_code"`
	ErrorMsg     string `json:"error_msg"`
	RequestId    string `json:"request_id"`
	Result       string `json:"result"`
	AdmitDuration uint64 `json:"admit_duration"`
	Duration     uint64 `json:"duration"`
}

// Recognize 识别语音（使用录音文件识别 API）
func (c *ASRClient) Recognize(audioData []byte, format, language string) (*SpeechRecognitionResult, error) {
	// 构造查询参数
	query := url.Values{}
	query.Set("app_id", c.AppID)

	// 发送请求
	host := "openspeech.bytedance.com"
	path := "/api/v1/asr"

	// 使用 multipart/form-data 上传
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("audio", "audio.webm")
	if err != nil {
		return nil, err
	}

	_, err = part.Write(audioData)
	if err != nil {
		return nil, err
	}

	writer.WriteField("app_id", c.AppID)
	writer.WriteField("language", language)
	writer.WriteField("format", format)
	writer.WriteField("uid", c.UID)
	writer.WriteField("enable_itn", "true")
	writer.WriteField("enable_punctuation", "true")

	contentType := writer.FormDataContentType()
	writer.Close()

	// 使用 HTTP 客户端直接发送
	reqURL := fmt.Sprintf("https://%s%s?%s", host, path, query.Encode())
	req, err := http.NewRequest("POST", reqURL, body)
	if err != nil {
		return nil, err
	}

	// 设置火山引擎认证头
	timestamp := time.Now().Unix()
	signature := c.generateSignature("POST", path, query.Encode(), timestamp)

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
		return nil, fmt.Errorf("ASR API error: %s", string(respBody))
	}

	var asrResp SpeechRecognitionResponse
	if err := json.Unmarshal(respBody, &asrResp); err != nil {
		return nil, err
	}

	if asrResp.ErrorCode != 0 && asrResp.ErrorCode != 2000 {
		return nil, fmt.Errorf("ASR error: %s (code: %d)", asrResp.ErrorMsg, asrResp.ErrorCode)
	}

	return &SpeechRecognitionResult{
		Text:       asrResp.Result,
		Duration:   float64(asrResp.Duration) / 1000.0, // 转换为秒
		Confidence: 0.95, // 火山引擎不返回置信度，使用默认值
	}, nil
}

// SpeechRecognitionResult 语音识别结果
type SpeechRecognitionResult struct {
	Text       string
	Duration   float64
	Confidence float64
}
