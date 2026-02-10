package repository

import (
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// VectorRepository handles vector operations
type VectorRepository struct {
	db *gorm.DB
}

func NewVectorRepository(db *gorm.DB) *VectorRepository {
	return &VectorRepository{db: db}
}

// SearchSimilar searches for similar vectors
func (r *VectorRepository) SearchSimilar(userID uint64, embedding []float32, limit int, threshold float32) ([]VectorSearchResult, error) {
	var results []VectorSearchResult

	query := `
		SELECT id, title, content, type, tags,
			   1 - (embedding <=> $1) as similarity
		FROM knowledge_base
		WHERE user_id = $2
		  AND embedding IS NOT NULL
		  AND 1 - (embedding <=> $1) > $3
		ORDER BY embedding <=> $1
		LIMIT $4
	`

	err := r.db.Raw(query, pq.Array(embedding), userID, threshold, limit).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	return results, nil
}

// VectorSearchResult represents a vector search result
type VectorSearchResult struct {
	ID         uint64    `json:"id"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	Type       string    `json:"type"`
	Tags       []string  `json:"tags"`
	Similarity float32   `json:"similarity"`
}
