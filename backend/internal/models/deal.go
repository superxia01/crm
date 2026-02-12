package models

import (
	"time"

	"gorm.io/gorm"
)

// Deal represents a sales deal / revenue record
type Deal struct {
	ID               uint64          `gorm:"primaryKey;autoIncrement" json:"id"`
	RecordNo         string          `gorm:"not null;uniqueIndex" json:"record_no"`
	UserID           uint64          `gorm:"not null;index" json:"user_id"`
	CustomerID       uint64          `gorm:"not null;index" json:"customer_id"`
	DealType         string          `gorm:"not null;default:'sale'" json:"deal_type"`
	ProductOrService string          `gorm:"not null" json:"product_or_service"`
	Quantity         float64         `gorm:"not null;default:1" json:"quantity"`
	Unit             string          `gorm:"not null;default:'piece'" json:"unit"`
	Amount           float64         `gorm:"not null" json:"amount"`
	Currency         string          `gorm:"not null;default:'CNY'" json:"currency"`
	ContractNo       string          `json:"contract_no,omitempty"`
	SignedAt         *time.Time      `json:"signed_at,omitempty"`
	PaymentStatus    string          `gorm:"not null;default:'pending'" json:"payment_status"`
	PaidAmount       float64         `gorm:"not null;default:0" json:"paid_amount"`
	PaidAt           *time.Time      `json:"paid_at,omitempty"`
	IsRepeatPurchase bool            `gorm:"not null;default:false" json:"is_repeat_purchase"`
	DealAt           time.Time       `gorm:"not null;index" json:"deal_at"`
	Notes            string          `json:"notes,omitempty"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
	DeletedAt        gorm.DeletedAt  `gorm:"index" json:"-"`

	// Associations (optional, for preload)
	Customer *Customer `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
}
