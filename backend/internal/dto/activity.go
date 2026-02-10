package dto

// ActivityResponse represents an activity item in the feed
type ActivityResponse struct {
	ID         uint                   `json:"id"`
	User       string                 `json:"user"`
	Text       string                 `json:"text"`
	Time       string                 `json:"time"`
	Type       string                 `json:"type"`      // 'user' or 'ai'
	CustomerID *uint64                `json:"customer_id,omitempty"`
	CustomerName string                `json:"customer_name,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

// CreateActivityRequest represents a request to create an activity
type CreateActivityRequest struct {
	ActionType    string                 `json:"action_type" binding:"required"`
	CustomerID    *uint64                `json:"customer_id,omitempty"`
	EntityType    string                 `json:"entity_type,omitempty"`
	EntityID      *uint64                `json:"entity_id,omitempty"`
	Description   string                 `json:"description" binding:"required"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	IsAIGenerated bool                   `json:"is_ai_generated"`
	AIConfidence  *float64               `json:"ai_confidence,omitempty"`
}

// RevenueHistoryResponse represents revenue data for a month
type RevenueHistoryResponse struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
	Target  float64 `json:"target"`
}

// PipelineRiskResponse represents a risky deal in the pipeline
type PipelineRiskResponse struct {
	ID        uint    `json:"id"`
	Deal      string  `json:"deal"`
	Client    string  `json:"client"`
	Company   string  `json:"company"`
	Value     string  `json:"value"`
	Stage     string  `json:"stage"`
	RiskLevel string  `json:"risk_level"` // 'High', 'Medium', 'Low'
	Reason    string  `json:"reason"`
	AIAdvice  string  `json:"ai_advice"`
	DaysIdle  int     `json:"days_idle,omitempty"`
}

// ActivitiesListResponse represents a paginated list of activities
type ActivitiesListResponse struct {
	Activities []ActivityResponse `json:"activities"`
 Total      int                 `json:"total"`
 Page       int                 `json:"page"`
 PerPage    int                 `json:"per_page"`
}
