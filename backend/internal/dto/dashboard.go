package dto

// StageStats represents statistics for a sales stage
type StageStats struct {
	Stage     string `json:"stage"`
	Count     int    `json:"count"`
	TotalValue string `json:"total_value"`
}

// DashboardStats represents dashboard statistics
type DashboardStats struct {
	TotalCustomers      int          `json:"total_customers"`
	TotalFollowUps      int          `json:"total_follow_ups"`
	StageDistribution   []StageStats `json:"stage_distribution"`
	UpcomingFollowUps   int          `json:"upcoming_follow_ups"`
	HighIntentCustomers int          `json:"high_intent_customers"`
	ThisMonthNew        int          `json:"this_month_new"`
}

// FunnelData represents sales funnel data
type FunnelData struct {
	Stage      string `json:"stage"`
	Count      int    `json:"count"`
	Percentage int    `json:"percentage"`
	Value      string `json:"value"`
}
