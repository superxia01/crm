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

// CustomerIntakeChat 新建客户对话（豆包）：引导用户收集所有信息，最后给出总结等待用户确认
func (s *AIService) CustomerIntakeChat(req *dto.CustomerIntakeChatRequest) (*dto.CustomerIntakeChatResponse, error) {
	systemPrompt := `你是「新建客户」助手，帮助用户快速完成客户信息录入。

【必填项】姓名(name)、公司(company)
【联系方式至少填一个】电话(phone)、邮箱(email)、微信号(wechat_id) - 三选一即可
【选填项】职位(position)、预算(budget)、意向等级(intent_level: High/Medium/Low)、备注(notes)

【工作流程】
1. 用简短友好的中文引导用户，优先收集：姓名、公司、联系方式（电话/邮箱/微信号任选其一）
2. 用户可能一次性说多条信息（如"张三，ABC科技公司，微信abc123"），请准确提取到对应字段
3. 尽量在一次对话中收集所有信息（包括选填项），可以主动询问选填项
4. **支持修改和补充**：用户可以说"把姓名改成李四"、"补充一下邮箱是xxx@xxx.com"、"电话错了，应该是13900139000"，请正确更新对应字段
5. 当必填项（姓名、公司）和至少一种联系方式都收集完成后，生成一份信息总结，格式如下：

━━━━━━━━━━━━━━━━━━
📋 客户信息确认
━━━━━━━━━━━━━━━━━━
姓名：张三
公司：ABC科技公司
职位：CTO
电话：13800138000
邮箱：zhangsan@abc.com
微信号：abc123
预算：¥50,000
意向等级：High
备注：有意向采购CRM系统
━━━━━━━━━━━━━━━━━━

请确认以上信息是否正确？回复"确认"即可创建客户。

5. 在总结之后，附加一个 JSON 块（用于系统处理）：
```json
{"status":"ready_for_confirmation","name":"张三","company":"ABC科技公司","position":"CTO","phone":"13800138000","email":"zhangsan@abc.com","wechat_id":"abc123","budget":"¥50,000","intent_level":"High","notes":"有意向采购CRM系统"}
```

【JSON 格式说明】
- status: "collecting"（收集中）或 "ready_for_confirmation"（等待确认）
- 当姓名、公司和至少一种联系方式（phone/email/wechat_id）都收集完成时，status 设为 "ready_for_confirmation"
- 只填已确认的字段，未确认的留空字符串 ""`

	// 构建消息列表
	messages := make([]doubao.ChatMessage, 0, len(req.Messages)+2)

	// 当前已收集的字段（供 AI 参考）
	currentJSON, _ := json.Marshal(req.CurrentFields)
	messages = append(messages, doubao.ChatMessage{
		Role:    "system",
		Content: systemPrompt + "\n\n【当前已收集的字段】\n" + string(currentJSON),
	})

	// 添加对话历史
	for _, m := range req.Messages {
		if m.Role == "system" {
			continue
		}
		messages = append(messages, doubao.ChatMessage{Role: m.Role, Content: m.Content})
	}

	// 调用豆包 API
	resp, err := s.doubaoClient.Chat(messages)
	if err != nil {
		return nil, err
	}
	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from AI")
	}

	content := strings.TrimSpace(resp.Choices[0].Message.Content)

	// 解析 AI 响应：提取用户看到的文案和 JSON 数据
	replyText, extracted, status := parseChatResponse(content)

	// 合并字段
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

	// ===== 后端验证：修正 AI 返回的状态 =====
	// 必填字段：姓名、公司
	requiredFields := []string{"name", "company"}
	requiredFieldsFilled := true
	for _, field := range requiredFields {
		if merged[field] == "" {
			requiredFieldsFilled = false
			break
		}
	}

	// 联系方式至少填一个：phone / email / wechat_id
	contactMethodFilled := merged["phone"] != "" || merged["email"] != "" || merged["wechat_id"] != ""

	// 判断是否可以进入确认阶段：必填项 + 至少一种联系方式
	allReady := requiredFieldsFilled && contactMethodFilled

	// 如果条件满足但 AI 状态仍是 collecting，修正为 ready_for_confirmation
	if allReady && status == "collecting" {
		status = "ready_for_confirmation"
	}
	// 如果条件不满足但 AI 状态是 ready_for_confirmation，修正为 collecting
	if !allReady && status == "ready_for_confirmation" {
		status = "collecting"
	}

	// 生成总结（当状态为等待确认时）
	var summary string
	if status == "ready_for_confirmation" {
		summary = generateCustomerSummary(merged)
	}

	return &dto.CustomerIntakeChatResponse{
		Reply:           replyText,
		ExtractedFields: merged,
		Status:          status,
		Summary:         summary,
	}, nil
}

// parseChatResponse 从 AI 回复中解析用户文案、提取的字段和状态
func parseChatResponse(content string) (reply string, fields map[string]string, status string) {
	fields = make(map[string]string)
	status = "collecting" // 默认状态
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
				// 提取状态
				if s, ok := m["status"]; ok {
					status = s
				}
			}
			reply = strings.TrimSpace(content[:jsonStart])
		}
	}
	return reply, fields, status
}

// generateCustomerSummary 生成客户信息总结
func generateCustomerSummary(fields map[string]string) string {
	var sb strings.Builder
	sb.WriteString("━━━━━━━━━━━━━━━━━━\n")
	sb.WriteString("📋 客户信息确认\n")
	sb.WriteString("━━━━━━━━━━━━━━━━━━\n")

	fieldLabels := map[string]string{
		"name":         "姓名",
		"company":      "公司",
		"position":     "职位",
		"phone":        "电话",
		"email":        "邮箱",
		"wechat_id":    "微信号",
		"budget":       "预算",
		"intent_level": "意向等级",
		"notes":        "备注",
	}

	for _, key := range []string{"name", "company", "position", "phone", "email", "wechat_id", "budget", "intent_level", "notes"} {
		if val := fields[key]; val != "" {
			sb.WriteString(fieldLabels[key])
			sb.WriteString("：")
			sb.WriteString(val)
			sb.WriteString("\n")
		}
	}

	sb.WriteString("━━━━━━━━━━━━━━━━━━\n")
	sb.WriteString("请确认以上信息是否正确？点击「确认创建」按钮即可创建客户。")
	return sb.String()
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
