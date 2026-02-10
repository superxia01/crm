package models

import (
	"time"
)

// Activity represents a user action or AI-generated event
type Activity struct {
	ID             uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID         uint64         `gorm:"not null;index" json:"user_id"`
	CustomerID     *uint64        `gorm:"index" json:"customer_id,omitempty"`
	ActionType     string         `gorm:"not null;size:50;index" json:"action_type"`
	EntityType     string         `gorm:"size:50" json:"entity_type,omitempty"`
	EntityID       *uint64        `json:"entity_id,omitempty"`
	Description    string         `gorm:"not null;type:text" json:"description"`
	Metadata       map[string]interface{} `gorm:"type:jsonb" json:"metadata,omitempty"`
	IsAIGenerated  bool           `gorm:"default:false" json:"is_ai_generated"`
	AIConfidence   *float64       `gorm:"type:decimal(3,2)" json:"ai_confidence,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	DeletedAt      *time.Time     `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName specifies the table name for Activity model
func (Activity) TableName() string {
	return "activities"
}

// RevenueHistory represents monthly revenue tracking
type RevenueHistory struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint64    `gorm:"not null;index" json:"user_id"`
	Month     string    `gorm:"not null;size:7;index" json:"month"` // Format: '2025-01'
	Year      int       `gorm:"not null;index" json:"year"`
	MonthNum  int       `gorm:"not null" json:"month_number"`
	Revenue   float64   `gorm:"type:decimal(15,2);default:0" json:"revenue"`
	Target    float64   `gorm:"type:decimal(15,2);default:0" json:"target"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName specifies the table name for RevenueHistory model
func (RevenueHistory) TableName() string {
	return "revenue_history"
}
