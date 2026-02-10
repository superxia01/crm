package models

import (
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

// KnowledgeBase represents a knowledge base entry
type KnowledgeBase struct {
	ID          uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      uint64         `gorm:"not null;index" json:"user_id"`

	Title       string         `gorm:"type:text;not null" json:"title"`
	Content     string         `gorm:"type:text;not null" json:"content"`
	Type        string         `gorm:"not null" json:"type"` // sales_script, product_info, faq, best_practice, objection_handling
	Tags        pq.StringArray `gorm:"type:text[]" json:"tags,omitempty"`
	Description string         `gorm:"type:text" json:"description,omitempty"`

	// Vector embedding for semantic search (stored as array in PostgreSQL)
	Embedding   []float32      `gorm:"type:vector(1536)" json:"embedding,omitempty"`

	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName specifies the table name for KnowledgeBase model
func (KnowledgeBase) TableName() string {
	return "knowledge_base"
}
