package models

import (
	"time"

	"gorm.io/gorm"
)

// Interaction represents a customer interaction
type Interaction struct {
	ID          uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      uint64         `gorm:"not null;index" json:"user_id"`
	CustomerID  uint64         `gorm:"not null;index" json:"customer_id"`

	Type        string         `gorm:"not null" json:"type"` // call, email, meeting, note
	Content     string         `gorm:"type:text" json:"content"`
	Outcome     string         `json:"outcome,omitempty"` // positive, neutral, negative
	NextAction  string         `json:"next_action,omitempty"`
	NextDate    *time.Time     `json:"next_date,omitempty"`

	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	// Relations
	Customer    *Customer      `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
}

// TableName specifies the table name for Interaction model
func (Interaction) TableName() string {
	return "interactions"
}
