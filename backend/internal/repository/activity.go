package repository

import (
	"fmt"
	"time"

	"github.com/xia/nextcrm/internal/models"
	"gorm.io/gorm"
)

type ActivityRepository struct {
	db *gorm.DB
}

func NewActivityRepository(db *gorm.DB) *ActivityRepository {
	return &ActivityRepository{db: db}
}

// Create creates a new activity
func (r *ActivityRepository) Create(activity *models.Activity) error {
	return r.db.Create(activity).Error
}

// GetByUserID retrieves activities for a user with pagination
func (r *ActivityRepository) GetByUserID(userID uint64, page, perPage int) ([]*models.Activity, int64, error) {
	var activities []*models.Activity
	var total int64

	query := r.db.Model(&models.Activity{}).Where("user_id = ? AND deleted_at IS NULL", userID)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated data
	offset := (page - 1) * perPage
	err := query.Order("created_at DESC").
		Limit(perPage).
		Offset(offset).
		Find(&activities).Error

	if err != nil {
		return nil, 0, err
	}

	return activities, total, nil
}

// GetRecentActivities retrieves recent activities for dashboard
func (r *ActivityRepository) GetRecentActivities(userID uint64, limit int) ([]*models.Activity, error) {
	var activities []*models.Activity
	err := r.db.Where("user_id = ? AND deleted_at IS NULL", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&activities).Error
	return activities, err
}

// GetByCustomerID retrieves activities for a specific customer
func (r *ActivityRepository) GetByCustomerID(customerID uint64, limit int) ([]*models.Activity, error) {
	var activities []*models.Activity
	err := r.db.Where("customer_id = ? AND deleted_at IS NULL", customerID).
		Order("created_at DESC").
		Limit(limit).
		Find(&activities).Error
	return activities, err
}

// GetRevenueHistory retrieves revenue history for a user
func (r *ActivityRepository) GetRevenueHistory(userID uint64, months int) ([]*models.RevenueHistory, error) {
	var history []*models.RevenueHistory

	// Get the last N months of data
	err := r.db.Where("user_id = ?", userID).
		Order("year DESC, month_number DESC").
		Limit(months).
		Find(&history).Error

	if err != nil {
		return nil, err
	}

	// Reverse to get chronological order
	for i, j := 0, len(history)-1; i < j; i, j = i+1, j-1 {
		history[i], history[j] = history[j], history[i]
	}

	return history, nil
}

// UpsertRevenueHistory creates or updates revenue history for a month
func (r *ActivityRepository) UpsertRevenueHistory(history *models.RevenueHistory) error {
	var existing models.RevenueHistory
	err := r.db.Where("user_id = ? AND month = ?", history.UserID, history.Month).
		First(&existing).Error

	if err == gorm.ErrRecordNotFound {
		// Create new
		return r.db.Create(history).Error
	} else if err != nil {
		return err
	}

	// Update existing
	existing.Revenue = history.Revenue
	existing.Target = history.Target
	return r.db.Save(&existing).Error
}

// CalculateMonthlyRevenue calculates revenue from signed contracts for a given month
func (r *ActivityRepository) CalculateMonthlyRevenue(userID uint64, year, month int) (float64, error) {
	var revenue float64

	// Sum contract_value from customers with 'Signed' or 'Active' contracts
	// that were signed in the specified month
	err := r.db.Model(&models.Customer{}).
		Select("COALESCE(SUM(CAST(NULLIF(contract_value, '') AS DECIMAL)), 0)").
		Where("user_id = ?", userID).
		Where("(contract_status = 'Signed' OR contract_status = 'Active')").
		Where("EXTRACT(YEAR FROM contract_start_date) = ?", year).
		Where("EXTRACT(MONTH FROM contract_start_date) = ?", month).
		Scan(&revenue).Error

	if err != nil {
		return 0, fmt.Errorf("failed to calculate revenue: %w", err)
	}

	return revenue, nil
}

// GetPipelineRisks identifies customers at risk based on various factors
func (r *ActivityRepository) GetPipelineRisks(userID uint64) ([]map[string]interface{}, error) {
	type RiskResult struct {
		ID             uint       `gorm:"column:id"`
		Name           string     `gorm:"column:name"`
		Company        string     `gorm:"column:company"`
		Stage          string     `gorm:"column:stage"`
		ContractValue  string     `gorm:"column:contract_value"`
		ExpectedCloseDate *time.Time `gorm:"column:expected_close_date"`
		LastContactAt  *time.Time `gorm:"column:last_contact"`
		FollowUpCount  int        `gorm:"column:follow_up_count"`
		IntentLevel    string     `gorm:"column:intent_level"`
	}

	var results []RiskResult
	err := r.db.Model(&models.Customer{}).
		Select("id, name, company, stage, contract_value, expected_close_date, last_contact, follow_up_count, intent_level").
		Where("user_id = ?", userID).
		Where("stage IN ('Leads', 'Qualified', 'Proposal', 'Negotiation')").
		Find(&results).Error

	if err != nil {
		return nil, err
	}

	risks := make([]map[string]interface{}, 0)
	now := time.Now()

	for _, customer := range results {
		riskLevel := "Low"
		reason := ""
		advice := ""
		daysIdle := 0

		// Calculate days idle since last contact
		if customer.LastContactAt != nil {
			daysIdle = int(now.Sub(*customer.LastContactAt).Hours() / 24)
		}

		// Evaluate risk factors
		if daysIdle > 21 {
			riskLevel = "High"
			reason = fmt.Sprintf("客户已 %d 天未跟进，可能已选择竞品", daysIdle)
			advice = "建议立即电话跟进，了解真实情况和决策进度"
		} else if daysIdle > 14 {
			riskLevel = "Medium"
			reason = fmt.Sprintf("客户已 %d 天未跟进", daysIdle)
			advice = "建议主动联系客户，保持沟通热度"
		} else if customer.IntentLevel == "Low" {
			riskLevel = "Medium"
			reason = "客户意向度较低"
			advice = "建议提供更有吸引力的方案或优惠"
		} else if customer.Stage == "Negotiation" && customer.ContractValue == "" {
			riskLevel = "High"
			reason = "谈判阶段未确定合同金额"
			advice = "建议尽快确认合同细节和金额"
		} else if customer.ExpectedCloseDate != nil && customer.ExpectedCloseDate.Before(now.AddDate(0, 0, 7)) {
			riskLevel = "Medium"
			reason = "预期成交日期即将到期"
			advice = "建议推动决策流程，必要时提供额外激励"
		}

		// Only add if there's some risk
		if riskLevel != "Low" || daysIdle > 7 {
			dealName := customer.Name
			if customer.Company != "" {
				dealName = customer.Name + " - " + customer.Company
			}

			risk := map[string]interface{}{
				"id":         customer.ID,
				"deal":       dealName,
				"client":     customer.Name,
				"company":    customer.Company,
				"value":      customer.ContractValue,
				"stage":      customer.Stage,
				"risk_level": riskLevel,
				"reason":     reason,
				"ai_advice":  advice,
				"days_idle":  daysIdle,
			}
			risks = append(risks, risk)
		}
	}

	return risks, nil
}
