package dto

// GenerateScriptRequest represents a request to generate sales script
type GenerateScriptRequest struct {
	Context      string `json:"context" binding:"required"`
	CustomerName string `json:"customer_name" binding:"required"`
	Industry     string `json:"industry"`
	PainPoints   string `json:"pain_points"`
	Scenario     string `json:"scenario"` // cold_call, follow_up, presentation, objection_handling
}

// GenerateScriptResponse represents the response from script generation
type GenerateScriptResponse struct {
	Script      string   `json:"script"`
	KeyPoints   []string `json:"key_points"`
	Tips        []string `json:"tips"`
}

// AnalyzeCustomerRequest represents a request to analyze customer
type AnalyzeCustomerRequest struct {
	CustomerID   uint64  `json:"customer_id" binding:"required"`
	AnalysisType string  `json:"analysis_type"` // intent, risk, opportunity, comprehensive
}

// AnalyzeCustomerResponse represents the response from customer analysis
type AnalyzeCustomerResponse struct {
	CustomerID     uint64   `json:"customer_id"`
	AnalysisType   string   `json:"analysis_type"`
	Summary        string   `json:"summary"`
	IntentScore    int      `json:"intent_score"` // 0-100
	RiskLevel      string   `json:"risk_level"`   // low, medium, high
	Opportunities  []string `json:"opportunities"`
	Recommendations []string `json:"recommendations"`
	NextActions    []string `json:"next_actions"`
}

// GenerateEmbeddingRequest represents a request to generate embedding
type GenerateEmbeddingRequest struct {
	Text string `json:"text" binding:"required"`
}

// GenerateEmbeddingResponse represents the response from embedding generation
type GenerateEmbeddingResponse struct {
	Embedding []float32 `json:"embedding"`
	Dimension int       `json:"dimension"`
}

// SpeechToTextResponse represents the response from speech recognition
type SpeechToTextResponse struct {
	Text       string  `json:"text"`
	Confidence float64 `json:"confidence"`
	Duration   float64 `json:"duration"` // 秒
}

// BusinessCardOCRResponse represents the response from business card OCR
type BusinessCardOCRResponse struct {
	Name       string  `json:"name"`
	Company    string  `json:"company"`
	Position   string  `json:"position"`
	Phone      string  `json:"phone"`
	Email      string  `json:"email"`
	Address    string  `json:"address"`
	Confidence float64 `json:"confidence"`
	RawText    string  `json:"raw_text,omitempty"` // 原始识别文本（当解析失败时）
}

// CustomerIntakeChatMessage 新建客户对话消息
type CustomerIntakeChatMessage struct {
	Role    string `json:"role"`    // user | assistant | system
	Content string `json:"content"`
}

// CustomerIntakeChatRequest 新建客户对话请求（对接豆包）
type CustomerIntakeChatRequest struct {
	Messages      []CustomerIntakeChatMessage `json:"messages" binding:"required"`
	CurrentFields map[string]string           `json:"current_fields"` // 当前已收集的字段，供 AI 参考
}

// CustomerIntakeChatResponse 新建客户对话响应
type CustomerIntakeChatResponse struct {
	Reply          string            `json:"reply"`           // AI 回复给用户看的文案
	ExtractedFields map[string]string `json:"extracted_fields"` // 从对话中解析出的字段（与 current_fields 合并后前端更新表单）
	CanCreate      bool              `json:"can_create"`       // 必填项是否已齐（姓名、公司、电话），可创建客户
}
