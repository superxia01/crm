package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xia/nextcrm/internal/api/middleware"
	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/models"
	"github.com/xia/nextcrm/internal/repository"
	"github.com/xia/nextcrm/pkg/utils"
)

type ActivityHandler struct {
	activityRepo *repository.ActivityRepository
	userRepo     *repository.UserRepository
}

func NewActivityHandler(activityRepo *repository.ActivityRepository, userRepo *repository.UserRepository) *ActivityHandler {
	return &ActivityHandler{
		activityRepo: activityRepo,
		userRepo:     userRepo,
	}
}

// GetActivities retrieves user's activity feed
func (h *ActivityHandler) GetActivities(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	// Get activities
	activities, total, err := h.activityRepo.GetByUserID(userID, page, perPage)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Convert to response format
	response := make([]dto.ActivityResponse, len(activities))
	for i, activity := range activities {
		// Get user info
		user, err := h.userRepo.FindByID(strconv.FormatUint(uint64(activity.UserID), 10))
		username := "未知用户"
		if err == nil && user != nil {
			if user.Nickname != nil {
				username = *user.Nickname
			} else if user.Name != nil {
				username = *user.Name
			}
		}

		// Determine type
		activityType := "user"
		if activity.IsAIGenerated {
			activityType = "ai"
			username = "AI"
		}

		// Format time
		timeStr := formatTimeAgo(activity.CreatedAt)

		response[i] = dto.ActivityResponse{
			ID:       activity.ID,
			User:     username,
			Text:     activity.Description,
			Time:     timeStr,
			Type:     activityType,
			Metadata: activity.Metadata,
		}
	}

	utils.SendSuccess(c, dto.ActivitiesListResponse{
		Activities: response,
		Total:      int(total),
		Page:       page,
		PerPage:    perPage,
	})
}

// GetRecentActivities retrieves recent activities for dashboard
func (h *ActivityHandler) GetRecentActivities(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	limit := 10
	activities, err := h.activityRepo.GetRecentActivities(userID, limit)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Convert to response format
	response := make([]dto.ActivityResponse, len(activities))
	for i, activity := range activities {
		// Get user info
		user, err := h.userRepo.FindByID(strconv.FormatUint(uint64(activity.UserID), 10))
		username := "你"
		if err == nil && user != nil {
			if user.Nickname != nil {
				username = *user.Nickname
			} else if user.Name != nil {
				username = *user.Name
			}
		}

		// Determine type
		activityType := "user"
		if activity.IsAIGenerated {
			activityType = "ai"
			username = "AI"
		}

		// Format time
		timeStr := formatTimeAgo(activity.CreatedAt)

		response[i] = dto.ActivityResponse{
			ID:   activity.ID,
			User: username,
			Text: activity.Description,
			Time: timeStr,
			Type: activityType,
		}
	}

	utils.SendSuccess(c, response)
}

// CreateActivity creates a new activity log
func (h *ActivityHandler) CreateActivity(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.CreateActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	activity := &models.Activity{
		UserID:        userID,
		CustomerID:    req.CustomerID,
		ActionType:    req.ActionType,
		EntityType:    req.EntityType,
		EntityID:      req.EntityID,
		Description:   req.Description,
		Metadata:      req.Metadata,
		IsAIGenerated: req.IsAIGenerated,
		AIConfidence:  req.AIConfidence,
	}

	if err := h.activityRepo.Create(activity); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Failed to create activity: "+err.Error())
		return
	}

	utils.SendSuccessWithMessage(c, "Activity created", map[string]interface{}{
		"id": activity.ID,
	})
}

// GetRevenueHistory retrieves revenue history for dashboard
func (h *ActivityHandler) GetRevenueHistory(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	// Get last 6 months of data
	history, err := h.activityRepo.GetRevenueHistory(userID, 6)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Convert to response format
	response := make([]dto.RevenueHistoryResponse, len(history))
	for i, h := range history {
		monthName := fmt.Sprintf("%d月", h.MonthNum)
		response[i] = dto.RevenueHistoryResponse{
			Month:   monthName,
			Revenue: h.Revenue,
			Target:  h.Target,
		}
	}

	utils.SendSuccess(c, response)
}

// GetPipelineRisks retrieves risky deals in the pipeline
func (h *ActivityHandler) GetPipelineRisks(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	risks, err := h.activityRepo.GetPipelineRisks(userID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SendSuccess(c, risks)
}

// formatTimeAgo formats a time as "X time ago"
func formatTimeAgo(t time.Time) string {
	duration := time.Since(t)

	hours := int(duration.Hours())
	days := int(duration.Hours() / 24)

	if days > 0 {
		return fmt.Sprintf("%d天前", days)
	}
	if hours > 0 {
		return fmt.Sprintf("%d小时前", hours)
	}
	minutes := int(duration.Minutes())
	if minutes > 0 {
		return fmt.Sprintf("%d分钟前", minutes)
	}
	return "刚刚"
}
