package repository

import (
	"time"

	"github.com/xia/nextcrm/internal/models"
	"github.com/xia/nextcrm/internal/dto"
	"gorm.io/gorm"
)

type CustomerRepository struct {
	db *gorm.DB
}

func NewCustomerRepository(db *gorm.DB) *CustomerRepository {
	return &CustomerRepository{db: db}
}

// Create creates a new customer
func (r *CustomerRepository) Create(customer *models.Customer) error {
	return r.db.Create(customer).Error
}

// FindByID finds a customer by ID
func (r *CustomerRepository) FindByID(id uint64) (*models.Customer, error) {
	var customer models.Customer
	err := r.db.Where("id = ?", id).First(&customer).Error
	if err != nil {
		return nil, err
	}
	return &customer, nil
}

// FindByUserID finds customers by user ID with pagination and filters
func (r *CustomerRepository) FindByUserID(userID uint64, query *dto.CustomerQuery) ([]*models.Customer, int64, error) {
	var customers []*models.Customer
	var total int64

	db := r.db.Model(&models.Customer{}).Where("user_id = ?", userID)

	// Apply filters
	if query.Search != "" {
		search := "%" + query.Search + "%"
		db = db.Where("name ILIKE ? OR company ILIKE ? OR email ILIKE ?", search, search, search)
	}

	if query.Stage != "" {
		db = db.Where("stage = ?", query.Stage)
	}

	if query.IntentLevel != "" {
		db = db.Where("intent_level = ?", query.IntentLevel)
	}

	if query.Source != "" {
		db = db.Where("source = ?", query.Source)
	}

	if query.Industry != "" {
		db = db.Where("industry = ?", query.Industry)
	}

	// Count total
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and sorting
	order := query.SortBy
	if query.SortOrder == "desc" {
		order += " DESC"
	}

	err := db.Order(order).
		Offset((query.Page - 1) * query.PerPage).
		Limit(query.PerPage).
		Find(&customers).Error

	if err != nil {
		return nil, 0, err
	}

	return customers, total, nil
}

// Update updates a customer
func (r *CustomerRepository) Update(customer *models.Customer) error {
	return r.db.Save(customer).Error
}

// Delete soft deletes a customer
func (r *CustomerRepository) Delete(id uint64) error {
	return r.db.Delete(&models.Customer{}, id).Error
}

// IncrementFollowUpCount increments the follow-up count
func (r *CustomerRepository) IncrementFollowUpCount(id uint64) error {
	return r.db.Model(&models.Customer{}).
		Where("id = ?", id).
		UpdateColumn("follow_up_count", gorm.Expr("follow_up_count + ?", 1)).
		Error
}

// SoftDelete soft deletes a customer (archive)
func (r *CustomerRepository) SoftDelete(id uint64) error {
	return r.db.Delete(&models.Customer{}, id).Error
}

// Restore restores a soft deleted customer
func (r *CustomerRepository) Restore(id uint64) error {
	return r.db.Unscoped().Model(&models.Customer{}).
		Where("id = ?", id).
		Update("deleted_at", nil).
		Error
}

// FindArchivedByUserID finds archived (soft deleted) customers by user ID
func (r *CustomerRepository) FindArchivedByUserID(userID uint64, query *dto.CustomerQuery) ([]*models.Customer, int64, error) {
	var customers []*models.Customer
	var total int64

	db := r.db.Model(&models.Customer{}).
		Unscoped().
		Where("user_id = ? AND deleted_at IS NOT NULL", userID)

	// Apply filters
	if query.Search != "" {
		search := "%" + query.Search + "%"
		db = db.Where("name ILIKE ? OR company ILIKE ? OR email ILIKE ?", search, search, search)
	}

	if query.Stage != "" {
		db = db.Where("stage = ?", query.Stage)
	}

	if query.IntentLevel != "" {
		db = db.Where("intent_level = ?", query.IntentLevel)
	}

	if query.Source != "" {
		db = db.Where("source = ?", query.Source)
	}

	if query.Industry != "" {
		db = db.Where("industry = ?", query.Industry)
	}

	// Count total
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and sorting
	order := query.SortBy
	if query.SortOrder == "desc" {
		order += " DESC"
	}

	err := db.Order(order).
		Offset((query.Page - 1) * query.PerPage).
		Limit(query.PerPage).
		Find(&customers).Error

	if err != nil {
		return nil, 0, err
	}

	return customers, total, nil
}

// CountByUserID counts total customers for a user
func (r *CustomerRepository) CountByUserID(userID uint64) (int, error) {
	var count int64
	err := r.db.Model(&models.Customer{}).Where("user_id = ?", userID).Count(&count).Error
	return int(count), err
}

// GetStageDistribution gets customer count and total value by stage
func (r *CustomerRepository) GetStageDistribution(userID uint64) ([]*dto.StageStats, error) {
	type Result struct {
		Stage      string
		Count      int
		TotalValue string
	}

	var results []Result

	// Note: contract_value is varchar in database, cannot use SUM() directly
	// Using COUNT only for now - value aggregation would require schema change
	// PostgreSQL doesn't support FIELD(), use CASE WHEN instead
	err := r.db.Model(&models.Customer{}).
		Select("stage, COUNT(*) as count, '0' as total_value").
		Where("user_id = ?", userID).
		Group("stage").
		Order("CASE stage WHEN 'Leads' THEN 1 WHEN 'Qualified' THEN 2 WHEN 'Proposal' THEN 3 WHEN 'Negotiation' THEN 4 WHEN 'Closed Won' THEN 5 ELSE 6 END").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	stageStats := make([]*dto.StageStats, len(results))
	for i, result := range results {
		stageStats[i] = &dto.StageStats{
			Stage:     result.Stage,
			Count:     result.Count,
			TotalValue: result.TotalValue,
		}
	}

	return stageStats, nil
}

// CountUpcomingFollowUps counts customers with follow-ups
func (r *CustomerRepository) CountUpcomingFollowUps(userID uint64) (int, error) {
	var count int64
	err := r.db.Model(&models.Customer{}).
		Where("user_id = ? AND follow_up_count > 0", userID).
		Count(&count).Error
	return int(count), err
}

// CountByIntentLevel counts customers by intent level
func (r *CustomerRepository) CountByIntentLevel(userID uint64, intentLevel string) (int, error) {
	var count int64
	err := r.db.Model(&models.Customer{}).
		Where("user_id = ? AND intent_level = ?", userID, intentLevel).
		Count(&count).Error
	return int(count), err
}

// CountNewThisMonth counts new customers added this month
func (r *CustomerRepository) CountNewThisMonth(userID uint64) (int, error) {
	var count int64
	now := time.Now()
	firstOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	err := r.db.Model(&models.Customer{}).
		Where("user_id = ? AND created_at >= ?", userID, firstOfMonth).
		Count(&count).Error
	return int(count), err
}
