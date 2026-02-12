package models

import (
	"time"

	"gorm.io/gorm"
)

// Customer represents a customer in the CRM system
type Customer struct {
	ID        uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint64         `gorm:"not null;index" json:"user_id"`

	// Basic Information
	Name        string `gorm:"not null" json:"name"`
	Company     string `gorm:"not null" json:"company"`
	Position    string `json:"position,omitempty"`
	Phone       string `gorm:"not null" json:"phone"`
	Email       string `json:"email,omitempty"`
	Industry    string `json:"industry,omitempty"`

	// Sales Information
	Budget          string  `gorm:"default:'Not Specified'" json:"budget,omitempty"`
	IntentLevel     string  `gorm:"default:'Medium'" json:"intent_level"` // High, Medium, Low
	Stage           string  `gorm:"default:'Leads'" json:"stage"`         // Leads, Qualified, Proposal, Negotiation, Closed
	Source          string  `gorm:"default:'Manual'" json:"source"`       // Manual, Website, Referral, etc.
	FollowUpCount   int     `gorm:"default:0" json:"follow_up_count"`

	// Contract Information
	ContractValue      string     `json:"contract_value,omitempty"`
	ContractStatus     string     `gorm:"default:'Pending'" json:"contract_status"` // Pending, Signed, Active, Expired
	ContractStartDate  *time.Time `json:"contract_start_date,omitempty"`
	ContractEndDate    *time.Time `json:"contract_end_date,omitempty"`
	ExpectedCloseDate  *time.Time `json:"expected_close_date,omitempty"`
	Probability        int        `gorm:"default:0" json:"probability"` // 0-100
	AnnualRevenue      string     `json:"annual_revenue,omitempty"`

	Notes        string     `json:"notes,omitempty"`
	LastContact  *time.Time `json:"last_contact,omitempty"`

	// Extended fields (optional)
	CustomerNo         string `json:"customer_no,omitempty"`
	CustomerType       string `json:"customer_type,omitempty"`        // 企业/个人/渠道
	WechatID           string `json:"wechat_id,omitempty"`
	Address            string `json:"address,omitempty"`
	CompanyScale       string `json:"company_scale,omitempty"`
	RegisteredCapital  string `json:"registered_capital,omitempty"`
	LegalPerson        string `json:"legal_person,omitempty"`
	CreditCode         string `json:"credit_code,omitempty"`
	CustomerLevel      string `json:"customer_level,omitempty"`   // A/B/C, VIP
	CustomerStatus     string `json:"customer_status,omitempty"`  // 活跃/休眠/流失
	PotentialScore     int    `json:"potential_score,omitempty"`  // 0-100
	InvoiceTitle       string `json:"invoice_title,omitempty"`
	TaxNumber          string `json:"tax_number,omitempty"`
	BankAccount        string `json:"bank_account,omitempty"`
	PaymentTerms       string `json:"payment_terms,omitempty"`

	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName specifies the table name for Customer model
func (Customer) TableName() string {
	return "customers"
}
