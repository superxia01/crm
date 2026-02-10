package service

import (
	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/models"
	"github.com/xia/nextcrm/internal/repository"
)

type KnowledgeService struct {
	knowledgeRepo *repository.KnowledgeRepository
	vectorRepo    *repository.VectorRepository
	aiService     *AIService
}

func NewKnowledgeService(
	knowledgeRepo *repository.KnowledgeRepository,
	vectorRepo *repository.VectorRepository,
	aiService *AIService,
) *KnowledgeService {
	return &KnowledgeService{
		knowledgeRepo: knowledgeRepo,
		vectorRepo:    vectorRepo,
		aiService:     aiService,
	}
}

// CreateKnowledge creates a new knowledge base entry
func (s *KnowledgeService) CreateKnowledge(userID uint64, req *dto.CreateKnowledgeRequest) (*dto.KnowledgeResponse, error) {
	knowledge := &models.KnowledgeBase{
		UserID:      userID,
		Title:       req.Title,
		Content:     req.Content,
		Type:        req.Type,
		Tags:        req.Tags,
		Description: req.Description,
	}

	if err := s.knowledgeRepo.Create(knowledge); err != nil {
		return nil, err
	}

	// Generate embedding asynchronously
	go s.generateEmbedding(knowledge.ID, req.Content)

	return s.toResponse(knowledge), nil
}

// GetKnowledgeByID retrieves a knowledge base entry by ID
func (s *KnowledgeService) GetKnowledgeByID(id, userID uint64) (*dto.KnowledgeResponse, error) {
	knowledge, err := s.knowledgeRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// Check if knowledge belongs to user
	if knowledge.UserID != userID {
		return nil, ErrUnauthorized
	}

	return s.toResponse(knowledge), nil
}

// ListKnowledge retrieves knowledge base entries with pagination
func (s *KnowledgeService) ListKnowledge(userID uint64, query *dto.KnowledgeQuery) ([]*dto.KnowledgeResponse, int, int64, error) {
	knowledges, total, err := s.knowledgeRepo.FindByUserID(userID, query)
	if err != nil {
		return nil, 0, 0, err
	}

	responses := make([]*dto.KnowledgeResponse, len(knowledges))
	for i, knowledge := range knowledges {
		responses[i] = s.toResponse(knowledge)
	}

	totalPages := int(total) / query.PerPage
	if int(total)%query.PerPage > 0 {
		totalPages++
	}

	return responses, totalPages, total, nil
}

// UpdateKnowledge updates a knowledge base entry
func (s *KnowledgeService) UpdateKnowledge(id, userID uint64, req *dto.UpdateKnowledgeRequest) (*dto.KnowledgeResponse, error) {
	knowledge, err := s.knowledgeRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// Check if knowledge belongs to user
	if knowledge.UserID != userID {
		return nil, ErrUnauthorized
	}

	// Update fields
	if req.Title != nil {
		knowledge.Title = *req.Title
	}
	if req.Content != nil {
		knowledge.Content = *req.Content
	}
	if req.Type != nil {
		knowledge.Type = *req.Type
	}
	if req.Tags != nil {
		knowledge.Tags = req.Tags
	}
	if req.Description != nil {
		knowledge.Description = *req.Description
	}

	if err := s.knowledgeRepo.Update(knowledge); err != nil {
		return nil, err
	}

	// Regenerate embedding if content changed
	if req.Content != nil {
		go s.generateEmbedding(knowledge.ID, *req.Content)
	}

	return s.toResponse(knowledge), nil
}

// DeleteKnowledge deletes a knowledge base entry
func (s *KnowledgeService) DeleteKnowledge(id, userID uint64) error {
	knowledge, err := s.knowledgeRepo.FindByID(id)
	if err != nil {
		return err
	}

	// Check if knowledge belongs to user
	if knowledge.UserID != userID {
		return ErrUnauthorized
	}

	return s.knowledgeRepo.Delete(id)
}

// SearchKnowledge performs vector similarity search
func (s *KnowledgeService) SearchKnowledge(userID uint64, req *dto.KnowledgeSearchRequest) ([]*dto.KnowledgeSearchResponse, error) {
	// Generate embedding for search query
	embeddingResp, err := s.aiService.GenerateEmbedding(req.Query)
	if err != nil {
		return nil, err
	}

	// Set limit
	limit := req.Limit
	if limit <= 0 || limit > 20 {
		limit = 10
	}

	// Perform vector search
	results, err := s.vectorRepo.SearchSimilar(userID, embeddingResp.Embedding, limit, 0.3)
	if err != nil {
		return nil, err
	}

	// Convert to response
	responses := make([]*dto.KnowledgeSearchResponse, len(results))
	for i, result := range results {
		responses[i] = &dto.KnowledgeSearchResponse{
			ID:         result.ID,
			Title:      result.Title,
			Content:    result.Content,
			Type:       result.Type,
			Tags:       result.Tags,
			Similarity: result.Similarity,
		}
	}

	return responses, nil
}

// generateEmbedding generates and stores embedding for knowledge
func (s *KnowledgeService) generateEmbedding(id uint64, content string) {
	embeddingResp, err := s.aiService.GenerateEmbedding(content)
	if err != nil {
		return
	}

	s.knowledgeRepo.UpdateEmbedding(id, embeddingResp.Embedding)
}

func (s *KnowledgeService) toResponse(knowledge *models.KnowledgeBase) *dto.KnowledgeResponse {
	return &dto.KnowledgeResponse{
		ID:          knowledge.ID,
		UserID:      knowledge.UserID,
		Title:       knowledge.Title,
		Content:     knowledge.Content,
		Type:        knowledge.Type,
		Tags:        knowledge.Tags,
		Description: knowledge.Description,
		CreatedAt:   knowledge.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   knowledge.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
