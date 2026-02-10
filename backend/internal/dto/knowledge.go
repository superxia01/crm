package dto

// CreateKnowledgeRequest represents a request to create knowledge base entry
type CreateKnowledgeRequest struct {
	Title       string   `json:"title" binding:"required"`
	Content     string   `json:"content" binding:"required"`
	Type        string   `json:"type" binding:"required"`
	Tags        []string `json:"tags"`
	Description string   `json:"description"`
}

// UpdateKnowledgeRequest represents a request to update knowledge base entry
type UpdateKnowledgeRequest struct {
	Title       *string   `json:"title"`
	Content     *string   `json:"content"`
	Type        *string   `json:"type"`
	Tags        []string  `json:"tags"`
	Description *string   `json:"description"`
}

// KnowledgeQuery represents query parameters for listing knowledge base
type KnowledgeQuery struct {
	Page    int      `form:"page,default=1"`
	PerPage int      `form:"per_page,default=10"`
	Search  string   `form:"search"`
	Type    string   `form:"type"`
	Tags    []string `form:"tags"`
}

// KnowledgeResponse represents a knowledge base entry response
type KnowledgeResponse struct {
	ID          uint64    `json:"id"`
	UserID      uint64    `json:"user_id"`
	Title       string    `json:"title"`
	Content     string    `json:"content"`
	Type        string    `json:"type"`
	Tags        []string  `json:"tags"`
	Description string    `json:"description"`
	CreatedAt   string    `json:"created_at"`
	UpdatedAt   string    `json:"updated_at"`
}

// KnowledgeSearchRequest represents a request to search knowledge base
type KnowledgeSearchRequest struct {
	Query       string   `json:"query" binding:"required"`
	Type        string   `json:"type"`
	Tags        []string `json:"tags"`
	Limit       int      `json:"limit"`
}

// KnowledgeSearchResponse represents search results
type KnowledgeSearchResponse struct {
	ID          uint64   `json:"id"`
	Title       string   `json:"title"`
	Content     string   `json:"content"`
	Type        string   `json:"type"`
	Tags        []string `json:"tags"`
	Similarity  float32  `json:"similarity"`
}
