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

// CustomerIntakeChat 新建客户对话（豆包）：引导用户用最少轮次填齐必填项，返回回复 + 解析出的字段 + 是否可创建
func (s *AIService) CustomerIntakeChat(req *dto.CustomerIntakeChatRequest) (*dto.CustomerIntakeChatResponse, error) {
	const (
		requiredFields = "name, company, phone" // 必填：姓名、公司、电话
		optionalFields = "position, email, budget, intent_level, notes"
	)

	systemPrompt := "你是「新建客户」助手，帮助用户在最少轮次内完成客户信息录入。\n\n" +
		"【必填项】姓名(name)、公司(company)、电话(phone)。三者齐了即可创建客户。\n" +
		"【选填项】职位(position)、邮箱(email)、预算(budget)、意向(intent_level: High/Medium/Low)、备注(notes)。用户说了就记录，没说也可先创建再让用户后续补充。\n\n" +
		"【规则】\n" +
		"1. 用简短、友好的中文回复，一次可只问缺的必填项，或一次问多个（如「请说一下客户姓名、公司和电话」）。\n" +
		"2. 用户可能一次说多条信息（如「张三，ABC公司，13800138000」），你必须识别并提取到对应字段。\n" +
		"3. 若用户已提供选填项，一并确认并记录。\n" +
		"4. 当必填项（姓名、公司、电话）全部齐了，回复中明确说「信息已齐，即将为您创建客户」或类似话术，并在末尾附上 JSON 块。\n" +
		"5. 每次回复末尾必须附一个 JSON 块，格式为：\n" +
		"```json\n" +
		"{\"name\":\"\",\"company\":\"\",\"phone\":\"\",\"position\":\"\",\"email\":\"\",\"budget\":\"\",\"intent_level\":\"Medium\",\"notes\":\"\"}\n" +
		"```\n" +
		"只填你从对话中已确认的字段，未确认的留空字符串。intent_level 未提供时用 \"Medium\"。"

	// 构建消息列表：system + 当前已收集的字段说明 + 对话历史
	messages := make([]doubao.ChatMessage, 0, len(req.Messages)+2)

	// 当前已收集的字段（供 AI 参考，避免重复问）
	currentJSON, _ := json.Marshal(req.CurrentFields)
	messages = append(messages, doubao.ChatMessage{
		Role:    "system",
		Content: systemPrompt + "\n\n【当前已收集的字段】\n" + string(currentJSON),
	})

	for _, m := range req.Messages {
		if m.Role == "system" {
			continue
		}
		messages = append(messages, doubao.ChatMessage{Role: m.Role, Content: m.Content})
	}

	resp, err := s.doubaoClient.Chat(messages)
	if err != nil {
		return nil, err
	}
	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from AI")
	}

	content := strings.TrimSpace(resp.Choices[0].Message.Content)
	replyText, extracted := parseReplyAndExtractedFields(content)

	// 合并当前字段与本次解析出的字段（解析出的非空值覆盖）
	merged := make(map[string]string)
	for k, v := range req.CurrentFields {
		if v != "" {
			merged[k] = v
		}
	}
	for k, v := range extracted {
		if v != "" {
			merged[k] = v
		}
	}

	canCreate := merged["name"] != "" && merged["company"] != "" && merged["phone"] != ""

	return &dto.CustomerIntakeChatResponse{
		Reply:          replyText,
		ExtractedFields: merged,
		CanCreate:      canCreate,
	}, nil
}

// parseReplyAndExtractedFields 从 AI 回复中分离「用户看到的文案」和「末尾 JSON 块」中的字段
func parseReplyAndExtractedFields(content string) (reply string, fields map[string]string) {
	fields = make(map[string]string)
	reply = content

	// 查找 ```json ... ``` 块
	jsonStart := strings.Index(content, "```json")
	if jsonStart == -1 {
		jsonStart = strings.Index(content, "```")
	}
	if jsonStart != -1 {
		blockStart := jsonStart
		if strings.HasPrefix(content[jsonStart:], "```json") {
			blockStart += 7
		} else {
			blockStart += 3
		}
		rest := content[blockStart:]
		jsonEnd := strings.Index(rest, "```")
		if jsonEnd != -1 {
			jsonStr := strings.TrimSpace(rest[:jsonEnd])
			var m map[string]string
			if err := json.Unmarshal([]byte(jsonStr), &m); err == nil {
				for k, v := range m {
					fields[k] = strings.TrimSpace(v)
				}
			}
			reply = strings.TrimSpace(content[:jsonStart])
		}
	}
	return reply, fields
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
