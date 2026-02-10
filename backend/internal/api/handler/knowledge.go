package handler

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/xia/nextcrm/internal/api/middleware"
	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/service"
	"github.com/xia/nextcrm/pkg/utils"
)

type KnowledgeHandler struct {
	knowledgeService *service.KnowledgeService
}

func NewKnowledgeHandler(knowledgeService *service.KnowledgeService) *KnowledgeHandler {
	return &KnowledgeHandler{
		knowledgeService: knowledgeService,
	}
}

// CreateKnowledge handles creating knowledge base entry
func (h *KnowledgeHandler) CreateKnowledge(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.CreateKnowledgeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	knowledge, err := h.knowledgeService.CreateKnowledge(userID, &req)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SendSuccessWithMessage(c, "Knowledge entry created successfully", knowledge)
}

// GetKnowledge handles getting a knowledge base entry by ID
func (h *KnowledgeHandler) GetKnowledge(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var knowledgeID uint64
	if _, err := fmt.Sscanf(id, "%d", &knowledgeID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid knowledge ID")
		return
	}

	knowledge, err := h.knowledgeService.GetKnowledgeByID(knowledgeID, userID)
	if err != nil {
		if err == service.ErrUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Access denied")
		} else {
			utils.SendError(c, http.StatusNotFound, "Knowledge not found")
		}
		return
	}

	utils.SendSuccess(c, knowledge)
}

// ListKnowledge handles listing knowledge base entries
func (h *KnowledgeHandler) ListKnowledge(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var query dto.KnowledgeQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid query parameters")
		return
	}

	knowledges, totalPages, total, err := h.knowledgeService.ListKnowledge(userID, &query)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	meta := &utils.Meta{
		Page:       query.Page,
		PerPage:    query.PerPage,
		Total:      total,
		TotalPages: totalPages,
	}

	utils.SendPaginated(c, knowledges, meta)
}

// UpdateKnowledge handles updating a knowledge base entry
func (h *KnowledgeHandler) UpdateKnowledge(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var knowledgeID uint64
	if _, err := fmt.Sscanf(id, "%d", &knowledgeID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid knowledge ID")
		return
	}

	var req dto.UpdateKnowledgeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	knowledge, err := h.knowledgeService.UpdateKnowledge(knowledgeID, userID, &req)
	if err != nil {
		if err == service.ErrUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Access denied")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccessWithMessage(c, "Knowledge updated successfully", knowledge)
}

// DeleteKnowledge handles deleting a knowledge base entry
func (h *KnowledgeHandler) DeleteKnowledge(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var knowledgeID uint64
	if _, err := fmt.Sscanf(id, "%d", &knowledgeID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid knowledge ID")
		return
	}

	err := h.knowledgeService.DeleteKnowledge(knowledgeID, userID)
	if err != nil {
		if err == service.ErrUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Access denied")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccessWithMessage(c, "Knowledge deleted successfully", nil)
}

// SearchKnowledge handles vector similarity search
func (h *KnowledgeHandler) SearchKnowledge(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.KnowledgeSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	results, err := h.knowledgeService.SearchKnowledge(userID, &req)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SendSuccess(c, results)
}
