package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xia/nextcrm/internal/api/middleware"
	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/service"
	"github.com/xia/nextcrm/pkg/utils"
)

type InteractionHandler struct {
	interactionService *service.InteractionService
}

func NewInteractionHandler(interactionService *service.InteractionService) *InteractionHandler {
	return &InteractionHandler{
		interactionService: interactionService,
	}
}

// CreateInteraction handles creating a new interaction
func (h *InteractionHandler) CreateInteraction(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.CreateInteractionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	// If customer_id is in URL path, use it
	if customerID := c.Param("customerId"); customerID != "" {
		var id uint64
		if _, err := fmt.Sscanf(customerID, "%d", &id); err == nil {
			req.CustomerID = id
		}
	}

	interaction, err := h.interactionService.CreateInteraction(userID, &req)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SendSuccessWithMessage(c, "Interaction created successfully", interaction)
}

// GetInteractionsByCustomerID handles getting all interactions for a customer
func (h *InteractionHandler) GetInteractionsByCustomerID(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	customerID := c.Param("customerId")

	var id uint64
	if _, err := fmt.Sscanf(customerID, "%d", &id); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid customer ID")
		return
	}

	interactions, err := h.interactionService.GetInteractionsByCustomerID(id, userID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SendSuccess(c, interactions)
}

// GetInteraction handles getting a specific interaction
func (h *InteractionHandler) GetInteraction(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var interactionID uint64
	if _, err := fmt.Sscanf(id, "%d", &interactionID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid interaction ID")
		return
	}

	interaction, err := h.interactionService.GetInteractionByID(interactionID, userID)
	if err != nil {
		if err == service.ErrInteractionNotFound || err == service.ErrUnauthorized {
			utils.SendError(c, http.StatusNotFound, "Interaction not found")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccess(c, interaction)
}

// UpdateInteraction handles updating an interaction
func (h *InteractionHandler) UpdateInteraction(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var interactionID uint64
	if _, err := fmt.Sscanf(id, "%d", &interactionID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid interaction ID")
		return
	}

	var req dto.UpdateInteractionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	interaction, err := h.interactionService.UpdateInteraction(interactionID, userID, &req)
	if err != nil {
		if err == service.ErrInteractionNotFound || err == service.ErrUnauthorized {
			utils.SendError(c, http.StatusNotFound, "Interaction not found")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccessWithMessage(c, "Interaction updated successfully", interaction)
}

// DeleteInteraction handles deleting an interaction
func (h *InteractionHandler) DeleteInteraction(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var interactionID uint64
	if _, err := fmt.Sscanf(id, "%d", &interactionID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid interaction ID")
		return
	}

	err := h.interactionService.DeleteInteraction(interactionID, userID)
	if err != nil {
		if err == service.ErrInteractionNotFound || err == service.ErrUnauthorized {
			utils.SendError(c, http.StatusNotFound, "Interaction not found")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccessWithMessage(c, "Interaction deleted successfully", nil)
}

// GetUpcomingInteractions handles getting upcoming interactions
func (h *InteractionHandler) GetUpcomingInteractions(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	// Get date from query param, default to today
	fromDateStr := c.DefaultQuery("from_date", time.Now().Format("2006-01-02"))
	fromDate, err := time.Parse("2006-01-02", fromDateStr)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid date format. Use YYYY-MM-DD")
		return
	}

	// Set to start of day
	fromDate = time.Date(fromDate.Year(), fromDate.Month(), fromDate.Day(), 0, 0, 0, 0, time.UTC)

	interactions, err := h.interactionService.GetUpcomingInteractions(userID, fromDate)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SendSuccess(c, interactions)
}
