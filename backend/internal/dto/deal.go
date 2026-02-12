package dto

import "time"

// CreateDealRequest represents a request to create a deal
type CreateDealRequest struct {
	CustomerID       uint64     `json:"customer_id" binding:"required"`
	DealType         string     `json:"deal_type"`
	ProductOrService string     `json:"product_or_service" binding:"required"`
	Quantity         float64    `json:"quantity"`
	Unit             string     `json:"unit"`
	Amount           float64    `json:"amount" binding:"required"`
	Currency         string     `json:"currency"`
	ContractNo       string     `json:"contract_no"`
	SignedAt         *time.Time `json:"signed_at"`
	PaymentStatus    string     `json:"payment_status"`
	PaidAmount       float64    `json:"paid_amount"`
	PaidAt           *time.Time `json:"paid_at"`
	IsRepeatPurchase bool       `json:"is_repeat_purchase"`
	DealAt           time.Time  `json:"deal_at" binding:"required"`
	Notes            string     `json:"notes"`
}

// UpdateDealRequest represents a request to update a deal
type UpdateDealRequest struct {
	DealType         *string    `json:"deal_type"`
	ProductOrService *string    `json:"product_or_service"`
	Quantity         *float64   `json:"quantity"`
	Unit             *string    `json:"unit"`
	Amount           *float64   `json:"amount"`
	Currency         *string    `json:"currency"`
	ContractNo       *string    `json:"contract_no"`
	SignedAt         *time.Time `json:"signed_at"`
	PaymentStatus    *string    `json:"payment_status"`
	PaidAmount       *float64   `json:"paid_amount"`
	PaidAt           *time.Time `json:"paid_at"`
	IsRepeatPurchase *bool     `json:"is_repeat_purchase"`
	DealAt           *time.Time `json:"deal_at"`
	Notes            *string    `json:"notes"`
}

// DealResponse represents a deal in API response
type DealResponse struct {
	ID               uint64     `json:"id"`
	RecordNo         string     `json:"record_no"`
	UserID           uint64     `json:"user_id"`
	CustomerID       uint64     `json:"customer_id"`
	DealType         string     `json:"deal_type"`
	ProductOrService string     `json:"product_or_service"`
	Quantity         float64    `json:"quantity"`
	Unit             string     `json:"unit"`
	Amount           float64    `json:"amount"`
	Currency         string     `json:"currency"`
	ContractNo       string     `json:"contract_no,omitempty"`
	SignedAt         *time.Time `json:"signed_at,omitempty"`
	PaymentStatus    string     `json:"payment_status"`
	PaidAmount       float64    `json:"paid_amount"`
	PaidAt           *time.Time `json:"paid_at,omitempty"`
	IsRepeatPurchase bool       `json:"is_repeat_purchase"`
	DealAt           time.Time  `json:"deal_at"`
	Notes            string     `json:"notes,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
	// Optional: customer name for list views
	CustomerName string `json:"customer_name,omitempty"`
}

// DealListQuery represents query parameters for listing deals
type DealListQuery struct {
	Page       int    `form:"page"`
	PerPage    int    `form:"per_page"`
	CustomerID uint64 `form:"customer_id"`
	UserID     uint64 `form:"user_id"` // filter by owner
	DealType   string `form:"deal_type"`
	SortBy     string `form:"sort_by"`
	SortOrder  string `form:"sort_order"`
}

// DealListResponse represents paginated list of deals
type DealListResponse struct {
	Deals []DealResponse `json:"deals"`
	Meta  struct {
		Page       int   `json:"page"`
		PerPage    int   `json:"per_page"`
		Total      int64 `json:"total"`
		TotalPages int   `json:"total_pages"`
	} `json:"meta"`
}

// CustomerDealsSummary is used for customer detail page (list by customer + summary)
type CustomerDealsSummary struct {
	Deals      []DealResponse `json:"deals"`
	TotalAmount float64       `json:"total_amount"`
	RepeatCount int           `json:"repeat_count"`
}
