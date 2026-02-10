package repository

import (
	"github.com/xia/nextcrm/internal/models"
	"github.com/xia/nextcrm/internal/dto"
	"gorm.io/gorm"
)

type KnowledgeRepository struct {
	db *gorm.DB
}

func NewKnowledgeRepository(db *gorm.DB) *KnowledgeRepository {
	return &KnowledgeRepository{db: db}
}

// Create creates a new knowledge base entry
func (r *KnowledgeRepository) Create(knowledge *models.KnowledgeBase) error {
	return r.db.Create(knowledge).Error
}

// FindByID finds a knowledge base entry by ID
func (r *KnowledgeRepository) FindByID(id uint64) (*models.KnowledgeBase, error) {
	var knowledge models.KnowledgeBase
	err := r.db.Where("id = ?", id).First(&knowledge).Error
	if err != nil {
		return nil, err
	}
	return &knowledge, nil
}

// FindByUserID finds knowledge base entries by user ID with pagination
func (r *KnowledgeRepository) FindByUserID(userID uint64, query *dto.KnowledgeQuery) ([]*models.KnowledgeBase, int64, error) {
	var knowledges []*models.KnowledgeBase
	var total int64

	db := r.db.Model(&models.KnowledgeBase{}).Where("user_id = ?", userID)

	// Apply filters
	if query.Search != "" {
		search := "%" + query.Search + "%"
		db = db.Where("title ILIKE ? OR content ILIKE ?", search, search)
	}

	if query.Type != "" {
		db = db.Where("type = ?", query.Type)
	}

	if len(query.Tags) > 0 {
		db = db.Where("tags && ?", query.Tags)
	}

	// Count total
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	err := db.Order("created_at DESC").
		Offset((query.Page - 1) * query.PerPage).
		Limit(query.PerPage).
		Find(&knowledges).Error

	if err != nil {
		return nil, 0, err
	}

	return knowledges, total, nil
}

// Update updates a knowledge base entry
func (r *KnowledgeRepository) Update(knowledge *models.KnowledgeBase) error {
	return r.db.Save(knowledge).Error
}

// Delete soft deletes a knowledge base entry
func (r *KnowledgeRepository) Delete(id uint64) error {
	return r.db.Delete(&models.KnowledgeBase{}, id).Error
}

// UpdateEmbedding updates the embedding for a knowledge base entry
func (r *KnowledgeRepository) UpdateEmbedding(id uint64, embedding []float32) error {
	return r.db.Model(&models.KnowledgeBase{}).
		Where("id = ?", id).
		Update("embedding", embedding).Error
}

// VectorSearch performs vector similarity search
func (r *KnowledgeRepository) VectorSearch(userID uint64, embedding []float32, limit int) ([]*models.KnowledgeBase, error) {
	var knowledges []*models.KnowledgeBase

	// 使用原始 SQL 查询进行向量相似度搜索
	query := `
		SELECT * FROM knowledge_base
		WHERE user_id = ?
		  AND embedding IS NOT NULL
		ORDER BY embedding <-> ?
		LIMIT ?
	`

	err := r.db.Raw(query, userID, pgvectorArray(embedding), limit).Scan(&knowledges).Error
	if err != nil {
		return nil, err
	}

	return knowledges, nil
}

// 辅助函数：将 []float32 转换为 PostgreSQL 数组格式
func pgvectorArray(vec []float32) interface{} {
	return vec
}
