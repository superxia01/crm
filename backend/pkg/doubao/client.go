package doubao

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// ChatMessage 聊天消息（兼容 OpenAI 格式）
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatResponse 聊天响应（兼容 OpenAI 格式）
type ChatResponse struct {
	Choices []struct {
		Message struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"message"`
		FinishReason string `json:"finish_reason"`
	} `json:"choices"`
}

// Client 豆包多模态客户端
type Client struct {
	BaseURL    string
	APIKey     string
	Model      string
	httpClient *http.Client
}

// NewClient 创建豆包客户端
func NewClient(baseURL, apiKey, model string) *Client {
	return &Client{
		BaseURL: baseURL,
		APIKey:  apiKey,
		Model:   model,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// ContentItem 消息内容项
type ContentItem struct {
	Type      string `json:"type"`
	Text      string `json:"text,omitempty"`
	ImageURL  string `json:"image_url,omitempty"`
	AudioURL  string `json:"audio_url,omitempty"`
}

// Message 消息
type Message struct {
	Role    string        `json:"role"`
	Content []ContentItem `json:"content"`
}

// Request API 请求
type Request struct {
	Model string   `json:"model"`
	Input []Message `json:"input"`
}

// Response API 响应
type Response struct {
	Choices []Choice `json:"choices"`
	Message Message  `json:"message"`
}

// Choice 选择项
type Choice struct {
	Message      Message `json:"message"`
	FinishReason string  `json:"finish_reason"`
}

// Chat 文本对话（兼容 OpenAI 格式）
func (c *Client) Chat(messages []ChatMessage) (*ChatResponse, error) {
	// 转换为豆包格式
	input := make([]Message, len(messages))
	for i, msg := range messages {
		input[i] = Message{
			Role: msg.Role,
			Content: []ContentItem{
				{
					Type: "input_text",
					Text: msg.Content,
				},
			},
		}
	}

	reqBody := map[string]interface{}{
		"model": c.Model,
		"input": input,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// 创建 HTTP 请求 - 使用正确的端点 /responses
	url := fmt.Sprintf("%s/responses", c.BaseURL)
	httpReq, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// 设置请求头
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))

	// 发送请求
	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	// 解析豆包 API 响应格式
	var apiResp struct {
		Output []struct {
			Type    string `json:"type"`
			Role    string `json:"role,omitempty"`
			Content []struct {
				Type string `json:"type"`
				Text string `json:"text,omitempty"`
			} `json:"content"`
		} `json:"output"`
	}

	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// 提取消息内容
	var textContent string
	for _, output := range apiResp.Output {
		if output.Type == "message" {
			for _, item := range output.Content {
				if item.Type == "output_text" && item.Text != "" {
					textContent = item.Text
					break
				}
			}
		}
	}

	// 转换为兼容格式返回
	return &ChatResponse{
		Choices: []struct {
			Message struct {
				Role    string `json:"role"`
				Content string `json:"content"`
			} `json:"message"`
			FinishReason string `json:"finish_reason"`
		}{
			{
				Message: struct {
					Role    string `json:"role"`
					Content string `json:"content"`
				}{
					Role:    "assistant",
					Content: textContent,
				},
				FinishReason: "stop",
			},
		},
	}, nil
}

// SpeechToText 语音识别
func (c *Client) SpeechToText(audioData []byte, format string) (string, error) {
	// 将音频转换为 base64
	audioBase64 := base64.StdEncoding.EncodeToString(audioData)
	// 创建数据 URL
	dataURL := fmt.Sprintf("data:audio/%s;base64,%s", format, audioBase64)

	req := Request{
		Model: c.Model,
		Input: []Message{
			{
				Role: "user",
				Content: []ContentItem{
					{
						Type:     "input_audio",
						AudioURL: dataURL,
					},
					{
						Type: "input_text",
						Text: "请将这段语音转换为文字，只返回转录的文字内容，不要添加任何解释或说明。",
					},
				},
			},
		},
	}

	return c.sendRequest(req)
}

// RecognizeBusinessCard 名片识别
func (c *Client) RecognizeBusinessCard(imageData []byte) (string, error) {
	// 将图片转换为 base64
	imageBase64 := base64.StdEncoding.EncodeToString(imageData)
	// 创建数据 URL
	dataURL := fmt.Sprintf("data:image/jpeg;base64,%s", imageBase64)

	req := Request{
		Model: c.Model,
		Input: []Message{
			{
				Role: "user",
				Content: []ContentItem{
					{
						Type:     "input_image",
						ImageURL: dataURL,
					},
					{
						Type: "input_text",
						Text: `请识别这张名片上的信息，并以JSON格式返回，包含以下字段：
- name: 姓名
- company: 公司名称
- position: 职位
- phone: 电话
- email: 邮箱
- address: 地址

只返回JSON，不要添加其他说明。`,
					},
				},
			},
		},
	}

	return c.sendRequest(req)
}

// sendRequest 发送请求（多模态：语音、图片）
func (c *Client) sendRequest(req Request) (string, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	// 创建 HTTP 请求 - 使用正确的端点 /responses
	url := fmt.Sprintf("%s/responses", c.BaseURL)
	httpReq, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// 设置请求头
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.APIKey))

	// 发送请求
	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	// 解析豆包 API 响应格式
	var apiResp struct {
		Output []struct {
			Type    string `json:"type"`
			Content []struct {
				Type string `json:"type"`
				Text string `json:"text,omitempty"`
			} `json:"content"`
		} `json:"output"`
	}

	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	// 提取消息内容（查找 output_text 类型）
	for _, output := range apiResp.Output {
		for _, item := range output.Content {
			if item.Type == "output_text" && item.Text != "" {
				return item.Text, nil
			}
		}
	}

	return "", fmt.Errorf("no content in response")
}
