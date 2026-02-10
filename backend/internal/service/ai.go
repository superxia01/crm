package service

import (
	"encoding/json"
	"fmt"
	"strings"
	"log"

	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/repository"
	"github.com/xia/nextcrm/pkg/deepseek"
	"github.com/xia/nextcrm/pkg/doubao"
)

type AIService struct {
	client       *deepseek.Client
	customerRepo *repository.CustomerRepository
	doubaoClient *doubao.Client    // 豆包多模态客户端
}

func NewAIService(
	client *deepseek.Client,
	customerRepo *repository.CustomerRepository,
	doubaoClient *doubao.Client,
) *AIService {
	return &AIService{
		client:       client,
		customerRepo: customerRepo,
		doubaoClient: doubaoClient,
	}
}

// chatWithFallback 优先使用豆包，失败时降级到 DeepSeek
func (s *AIService) chatWithFallback(messages []deepseek.ChatMessage) (*deepseek.ChatResponse, error) {
	// 转换为豆包格式
	doubaoMessages := make([]doubao.ChatMessage, len(messages))
	for i, msg := range messages {
		doubaoMessages[i] = doubao.ChatMessage{
			Role:    msg.Role,
			Content: msg.Content,
		}
	}

	// 优先尝试豆包
	if s.doubaoClient != nil {
		resp, err := s.doubaoClient.Chat(doubaoMessages)
		if err == nil && len(resp.Choices) > 0 {
			// 豆包成功，转换为 DeepSeek 格式返回
			return &deepseek.ChatResponse{
				Choices: []deepseek.ChatChoice{
					{
						Message: deepseek.ChatMessage{
							Role:    resp.Choices[0].Message.Role,
							Content: resp.Choices[0].Message.Content,
						},
						FinishReason: resp.Choices[0].FinishReason,
					},
				},
			}, nil
		}
		// 豆包失败，记录日志并降级
		log.Printf("豆包调用失败，降级到 DeepSeek: %v", err)
	}

	// 降级到 DeepSeek
	if s.client != nil {
		return s.client.Chat(messages)
	}

	return nil, fmt.Errorf("both Doubao and DeepSeek clients are unavailable")
}

// GenerateScript generates a sales script
func (s *AIService) GenerateScript(req *dto.GenerateScriptRequest) (*dto.GenerateScriptResponse, error) {
	systemPrompt := `You are an expert sales assistant. Generate professional sales scripts based on the provided context.
The script should be:
- Professional and friendly
- Tailored to the customer's industry and pain points
- Persuasive but not pushy
- Structured with clear sections (opening, value proposition, handling objections, closing)`

	userPrompt := fmt.Sprintf(`Generate a sales script with the following details:
- Customer Name: %s
- Industry: %s
- Context: %s
- Pain Points: %s
- Scenario: %s

Please provide:
1. A complete sales script
2. Key talking points (3-5 bullet points)
3. Tips for success (3-5 bullet points)

Respond in JSON format:
{
  "script": "the complete script",
  "key_points": ["point 1", "point 2", ...],
  "tips": ["tip 1", "tip 2", ...]
}`,
		req.CustomerName, req.Industry, req.Context, req.PainPoints, req.Scenario)

	messages := []deepseek.ChatMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}

	resp, err := s.chatWithFallback(messages)
	if err != nil {
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from AI")
	}

	// Parse the JSON response
	var result dto.GenerateScriptResponse
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &result); err != nil {
		// If JSON parsing fails, create a basic response
		return &dto.GenerateScriptResponse{
			Script: resp.Choices[0].Message.Content,
		}, nil
	}

	return &result, nil
}

// AnalyzeCustomer analyzes a customer
func (s *AIService) AnalyzeCustomer(customerID uint64, analysisType string) (*dto.AnalyzeCustomerResponse, error) {
	// Get customer data
	customer, err := s.customerRepo.FindByID(customerID)
	if err != nil {
		return nil, err
	}

	systemPrompt := `You are an expert sales analyst. Analyze customer data and provide actionable insights.
Focus on: purchase intent, risk factors, opportunities, and specific recommendations.`

	userPrompt := fmt.Sprintf(`Analyze the following customer:
- Name: %s
- Company: %s
- Position: %s
- Industry: %s
- Budget: %s
- Intent Level: %s
- Stage: %s
- Source: %s
- Contract Value: %s
- Contract Status: %s
- Probability: %d%%
- Notes: %s

Analysis Type: %s

Provide:
1. A brief summary (2-3 sentences)
2. Intent score (0-100)
3. Risk level (low, medium, high)
4. Key opportunities (3-5 bullet points)
5. Specific recommendations (3-5 bullet points)
6. Suggested next actions (3-5 bullet points)

Respond in JSON format:
{
  "summary": "...",
  "intent_score": 75,
  "risk_level": "medium",
  "opportunities": ["opportunity 1", ...],
  "recommendations": ["recommendation 1", ...],
  "next_actions": ["action 1", ...]
}`,
		customer.Name, customer.Company, customer.Position, customer.Industry,
		customer.Budget, customer.IntentLevel, customer.Stage, customer.Source,
		customer.ContractValue, customer.ContractStatus, customer.Probability,
		customer.Notes, analysisType)

	messages := []deepseek.ChatMessage{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}

	resp, err := s.chatWithFallback(messages)
	if err != nil {
		return nil, err
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from AI")
	}

	// Parse the JSON response
	var result dto.AnalyzeCustomerResponse
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &result); err != nil {
		// If JSON parsing fails, return a basic response
		return &dto.AnalyzeCustomerResponse{
			CustomerID:   customerID,
			AnalysisType: analysisType,
			Summary:      resp.Choices[0].Message.Content,
		}, nil
	}

	result.CustomerID = customerID
	result.AnalysisType = analysisType
	return &result, nil
}

// GenerateEmbedding generates an embedding for the given text
func (s *AIService) GenerateEmbedding(text string) (*dto.GenerateEmbeddingResponse, error) {
	resp, err := s.client.CreateEmbedding(text)
	if err != nil {
		return nil, err
	}

	if len(resp.Data) == 0 {
		return nil, fmt.Errorf("no embedding returned")
	}

	return &dto.GenerateEmbeddingResponse{
		Embedding: resp.Data[0].Embedding,
		Dimension: len(resp.Data[0].Embedding),
	}, nil
}

// SpeechToText 语音识别
func (s *AIService) SpeechToText(audioData []byte, format, language string) (*dto.SpeechToTextResponse, error) {
	text, err := s.doubaoClient.SpeechToText(audioData, format)
	if err != nil {
		return nil, err
	}

	return &dto.SpeechToTextResponse{
		Text:       strings.TrimSpace(text),
		Confidence: 0.95, // 豆包不返回置信度，使用默认值
		Duration:   0,    // 豆包不返回时长，使用默认值
	}, nil
}

// RecognizeBusinessCard 识别名片
func (s *AIService) RecognizeBusinessCard(imageData []byte) (*dto.BusinessCardOCRResponse, error) {
	jsonStr, err := s.doubaoClient.RecognizeBusinessCard(imageData)
	if err != nil {
		return nil, err
	}

	// 解析 JSON 响应
	var result struct {
		Name     string `json:"name"`
		Company  string `json:"company"`
		Position string `json:"position"`
		Phone    string `json:"phone"`
		Email    string `json:"email"`
		Address  string `json:"address"`
	}

	// 尝试从响应中提取 JSON
	jsonStart := strings.Index(jsonStr, "{")
	jsonEnd := strings.LastIndex(jsonStr, "}")

	if jsonStart != -1 && jsonEnd != -1 && jsonEnd > jsonStart {
		jsonContent := jsonStr[jsonStart : jsonEnd+1]
		if err := json.Unmarshal([]byte(jsonContent), &result); err == nil {
			return &dto.BusinessCardOCRResponse{
				Name:       result.Name,
				Company:    result.Company,
				Position:   result.Position,
				Phone:      result.Phone,
				Email:      result.Email,
				Address:    result.Address,
				Confidence: 0.92, // 豆包不返回置信度，使用默认值
			}, nil
		}
	}

	// 如果 JSON 解析失败，返回原始文本
	return &dto.BusinessCardOCRResponse{
		Name:       "",
		Company:    "",
		Position:   "",
		Phone:      "",
		Email:      "",
		Address:    "",
		Confidence: 0,
		RawText:    jsonStr,
	}, nil
}
