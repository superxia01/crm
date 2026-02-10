package dto

import "time"

// CreateCustomerRequest represents a request to create a customer
type CreateCustomerRequest struct {
	Name            string  `json:"name" binding:"required"`
	Company         string  `json:"company" binding:"required"`
	Position        string  `json:"position"`
	Phone           string  `json:"phone" binding:"required"`
	Email           string  `json:"email" binding:"omitempty,email"`
	Industry        string  `json:"industry"`
	Budget          string  `json:"budget"`
	IntentLevel     string  `json:"intent_level"`
	Stage           string  `json:"stage"`
	Source          string  `json:"source"`
	ContractValue   string  `json:"contract_value"`
	ContractStatus  string  `json:"contract_status"`
	ExpectedCloseDate *time.Time `json:"expected_close_date"`
	Probability     int     `json:"probability"`
	AnnualRevenue   string  `json:"annual_revenue"`
	Notes           string  `json:"notes"`
}

// UpdateCustomerRequest represents a request to update a customer
type UpdateCustomerRequest struct {
	Name            *string  `json:"name"`
	Company         *string  `json:"company"`
	Position        *string  `json:"position"`
	Phone           *string  `json:"phone"`
	Email           *string  `json:"email"`
	Industry        *string  `json:"industry"`
	Budget          *string  `json:"budget"`
	IntentLevel     *string  `json:"intent_level"`
	Stage           *string  `json:"stage"`
	Source          *string  `json:"source"`
	FollowUpCount   *int     `json:"follow_up_count"`
	ContractValue   *string  `json:"contract_value"`
	ContractStatus  *string  `json:"contract_status"`
	ContractStartDate *time.Time `json:"contract_start_date"`
	ContractEndDate   *time.Time `json:"contract_end_date"`
	ExpectedCloseDate *time.Time `json:"expected_close_date"`
	Probability      *int     `json:"probability"`
	AnnualRevenue    *string  `json:"annual_revenue"`
	Notes            *string  `json:"notes"`
	LastContact      *time.Time `json:"last_contact"`
}

// CustomerQuery represents query parameters for listing customers
type CustomerQuery struct {
	Page       int    `form:"page,default=1"`
	PerPage    int    `form:"per_page,default=10"`
	Search     string `form:"search"`
	Stage      string `form:"stage"`
	IntentLevel string `form:"intent_level"`
	Source     string `form:"source"`
	Industry   string `form:"industry"`
	SortBy     string `form:"sort_by,default=created_at"`
	SortOrder  string `form:"sort_order,default=desc"`
}

// CustomerResponse represents a customer response
type CustomerResponse struct {
	ID              uint64      `json:"id"`
	UserID          uint64      `json:"user_id"`
	Name            string      `json:"name"`
	Company         string      `json:"company"`
	Position        string      `json:"position"`
	Phone           string      `json:"phone"`
	Email           string      `json:"email"`
	Industry        string      `json:"industry"`
	Budget          string      `json:"budget"`
	IntentLevel     string      `json:"intent_level"`
	Stage           string      `json:"stage"`
	Source          string      `json:"source"`
	FollowUpCount   int         `json:"follow_up_count"`
	ContractValue   string      `json:"contract_value"`
	ContractStatus  string      `json:"contract_status"`
	ContractStartDate *time.Time `json:"contract_start_date"`
	ContractEndDate   *time.Time `json:"contract_end_date"`
	ExpectedCloseDate *time.Time `json:"expected_close_date"`
	Probability      int        `json:"probability"`
	AnnualRevenue    string     `json:"annual_revenue"`
	Notes            string     `json:"notes"`
	LastContact      *time.Time `json:"last_contact"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}
