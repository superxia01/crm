package repository

import (
	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/models"
	"gorm.io/gorm"
)

type DealRepository struct {
	db *gorm.DB
}

func NewDealRepository(db *gorm.DB) *DealRepository {
	return &DealRepository{db: db}
}

func (r *DealRepository) Create(deal *models.Deal) error {
	return r.db.Create(deal).Error
}

func (r *DealRepository) Update(deal *models.Deal) error {
	return r.db.Save(deal).Error
}

func (r *DealRepository) FindByID(id uint64) (*models.Deal, error) {
	var deal models.Deal
	err := r.db.Where("id = ?", id).First(&deal).Error
	if err != nil {
		return nil, err
	}
	return &deal, nil
}

func (r *DealRepository) FindByRecordNo(recordNo string) (*models.Deal, error) {
	var deal models.Deal
	err := r.db.Where("record_no = ?", recordNo).First(&deal).Error
	if err != nil {
		return nil, err
	}
	return &deal, nil
}

func (r *DealRepository) List(query *dto.DealListQuery, userID uint64) ([]*models.Deal, int64, error) {
	var deals []*models.Deal
	var total int64

	db := r.db.Model(&models.Deal{}).Where("user_id = ?", userID)

	if query.CustomerID > 0 {
		db = db.Where("customer_id = ?", query.CustomerID)
	}
	if query.DealType != "" {
		db = db.Where("deal_type = ?", query.DealType)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	order := "deal_at DESC"
	if query.SortBy != "" {
		order = query.SortBy
		if query.SortOrder == "asc" {
			order += " ASC"
		} else {
			order += " DESC"
		}
	}

	page, perPage := query.Page, query.PerPage
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	err := db.Order(order).
		Offset((page - 1) * perPage).
		Limit(perPage).
		Find(&deals).Error
	if err != nil {
		return nil, 0, err
	}
	return deals, total, nil
}

func (r *DealRepository) ListByCustomerID(customerID uint64, userID uint64) ([]*models.Deal, error) {
	var deals []*models.Deal
	err := r.db.Where("customer_id = ? AND user_id = ?", customerID, userID).
		Order("deal_at DESC").
		Find(&deals).Error
	if err != nil {
		return nil, err
	}
	return deals, nil
}

func (r *DealRepository) Delete(id uint64) error {
	return r.db.Delete(&models.Deal{}, id).Error
}
