package dto

import "time"

// CreateInteractionRequest represents a request to create an interaction
type CreateInteractionRequest struct {
	CustomerID uint64                 `json:"customer_id" binding:"required"`
	Type       string                 `json:"type" binding:"required"` // call, email, meeting, note
	Content    string                 `json:"content"`
	Outcome    string                 `json:"outcome,omitempty"` // positive, neutral, negative
	NextAction string                 `json:"next_action,omitempty"`
	NextDate   *time.Time             `json:"next_date,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

// UpdateInteractionRequest represents a request to update an interaction
type UpdateInteractionRequest struct {
	Type       string                 `json:"type"`
	Content    string                 `json:"content"`
	Outcome    string                 `json:"outcome,omitempty"`
	NextAction string                 `json:"next_action,omitempty"`
	NextDate   *time.Time             `json:"next_date,omitempty"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
}

// InteractionResponse represents an interaction response
type InteractionResponse struct {
	ID          uint64                 `json:"id"`
	CustomerID  uint64                 `json:"customer_id"`
	Customer    *CustomerSummary       `json:"customer,omitempty"`
	Type        string                 `json:"type"`
	Content     string                 `json:"content"`
	Outcome     string                 `json:"outcome,omitempty"`
	NextAction  string                 `json:"next_action,omitempty"`
	NextDate    *time.Time             `json:"next_date,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// CustomerSummary represents a minimal customer info
type CustomerSummary struct {
	ID     uint64 `json:"id"`
	Name   string `json:"name"`
	Company string `json:"company"`
}
