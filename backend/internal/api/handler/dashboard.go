package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/xia/nextcrm/internal/api/middleware"
	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/repository"
	"github.com/xia/nextcrm/pkg/utils"
)

type DashboardHandler struct {
	customerRepo *repository.CustomerRepository
}

func NewDashboardHandler(customerRepo *repository.CustomerRepository) *DashboardHandler {
	return &DashboardHandler{
		customerRepo: customerRepo,
	}
}

// GetDashboardStats retrieves dashboard statistics
func (h *DashboardHandler) GetDashboardStats(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	// Get total customers
	totalCustomers, err := h.customerRepo.CountByUserID(userID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Get stage distribution
	stageDistribution, err := h.customerRepo.GetStageDistribution(userID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Get upcoming follow-ups (customers with follow_up_count > 0)
	upcomingFollowUps, err := h.customerRepo.CountUpcomingFollowUps(userID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Get high intent customers
	highIntentCustomers, err := h.customerRepo.CountByIntentLevel(userID, "High")
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Get this month new customers
	thisMonthNew, err := h.customerRepo.CountNewThisMonth(userID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	stats := &dto.DashboardStats{
		TotalCustomers:      totalCustomers,
		TotalFollowUps:      upcomingFollowUps,
		StageDistribution: convertStageStats(stageDistribution),
		UpcomingFollowUps:   upcomingFollowUps,
		HighIntentCustomers: highIntentCustomers,
		ThisMonthNew:        thisMonthNew,
	}

	utils.SendSuccess(c, stats)
}

// GetSalesFunnel retrieves sales funnel data
func (h *DashboardHandler) GetSalesFunnel(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	stageDistribution, err := h.customerRepo.GetStageDistribution(userID)
	if err != nil {
		// Return empty funnel on error so frontend does not break (e.g. DB/schema issues)
		utils.SendSuccess(c, []dto.FunnelData{})
		return
	}

	// Calculate total for percentage
	total := 0
	for _, stage := range stageDistribution {
		total += stage.Count
	}

	// Convert to funnel data
	funnelData := make([]dto.FunnelData, len(stageDistribution))
	stageOrder := []string{"Leads", "Qualified", "Proposal", "Negotiation", "Closed Won"}

	stageMap := make(map[string]*dto.StageStats)
	for i := range stageDistribution {
		stageMap[stageDistribution[i].Stage] = stageDistribution[i]
	}

	for i, stageName := range stageOrder {
		stageStats, exists := stageMap[stageName]
		count := 0
		value := "0"

		if exists {
			count = stageStats.Count
			value = stageStats.TotalValue
		}

		percentage := 0
		if total > 0 {
			percentage = int(float64(count) / float64(total) * 100)
		}

		funnelData[i] = dto.FunnelData{
			Stage:      stageName,
			Count:      count,
			Percentage: percentage,
			Value:      value,
		}
	}

	utils.SendSuccess(c, funnelData)
}

// convertStageStats converts pointer slice to value slice
func convertStageStats(stats []*dto.StageStats) []dto.StageStats {
	result := make([]dto.StageStats, len(stats))
	for i, s := range stats {
		result[i] = *s
	}
	return result
}
