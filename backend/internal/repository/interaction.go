package repository

import (
	"time"

	"github.com/xia/nextcrm/internal/models"
	"gorm.io/gorm"
)

type InteractionRepository struct {
	db *gorm.DB
}

func NewInteractionRepository(db *gorm.DB) *InteractionRepository {
	return &InteractionRepository{db: db}
}

// Create creates a new interaction
func (r *InteractionRepository) Create(interaction *models.Interaction) error {
	return r.db.Create(interaction).Error
}

// FindByID finds an interaction by ID
func (r *InteractionRepository) FindByID(id uint64) (*models.Interaction, error) {
	var interaction models.Interaction
	err := r.db.Where("id = ?", id).First(&interaction).Error
	if err != nil {
		return nil, err
	}
	return &interaction, nil
}

// FindByCustomerID finds all interactions for a customer
func (r *InteractionRepository) FindByCustomerID(customerID uint64) ([]*models.Interaction, error) {
	var interactions []*models.Interaction
	err := r.db.Where("customer_id = ?", customerID).
		Order("created_at DESC").
		Find(&interactions).Error
	if err != nil {
		return nil, err
	}
	return interactions, nil
}

// FindByUserID finds all interactions for a user
func (r *InteractionRepository) FindByUserID(userID uint64) ([]*models.Interaction, error) {
	var interactions []*models.Interaction
	err := r.db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&interactions).Error
	if err != nil {
		return nil, err
	}
	return interactions, nil
}

// FindByCustomerIDAndUserID finds interactions for a specific customer belonging to a user
func (r *InteractionRepository) FindByCustomerIDAndUserID(customerID, userID uint64) ([]*models.Interaction, error) {
	var interactions []*models.Interaction
	err := r.db.Where("customer_id = ? AND user_id = ?", customerID, userID).
		Order("created_at DESC").
		Find(&interactions).Error
	if err != nil {
		return nil, err
	}
	return interactions, nil
}

// Update updates an interaction
func (r *InteractionRepository) Update(interaction *models.Interaction) error {
	return r.db.Save(interaction).Error
}

// Delete soft deletes an interaction
func (r *InteractionRepository) Delete(id uint64) error {
	return r.db.Delete(&models.Interaction{}, id).Error
}

// FindUpcoming finds all upcoming interactions (with next_date set)
func (r *InteractionRepository) FindUpcoming(userID uint64, fromDate time.Time) ([]*models.Interaction, error) {
	var interactions []*models.Interaction
	err := r.db.Where("user_id = ? AND next_date >= ?", userID, fromDate).
		Order("next_date ASC").
		Find(&interactions).Error
	if err != nil {
		return nil, err
	}
	return interactions, nil
}

// CountByCustomerID counts the number of interactions for a customer
func (r *InteractionRepository) CountByCustomerID(customerID uint64) (int64, error) {
	var count int64
	err := r.db.Model(&models.Interaction{}).
		Where("customer_id = ?", customerID).
		Count(&count).Error
	if err != nil {
		return 0, err
	}
	return count, nil
}
