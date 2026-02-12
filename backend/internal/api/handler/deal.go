package handler

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/xia/nextcrm/internal/api/middleware"
	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/service"
	"github.com/xia/nextcrm/pkg/utils"
)

type DealHandler struct {
	dealService *service.DealService
}

func NewDealHandler(dealService *service.DealService) *DealHandler {
	return &DealHandler{dealService: dealService}
}

func parseUint64Param(c *gin.Context, name string) (uint64, bool) {
	s := c.Param(name)
	var id uint64
	if _, err := fmt.Sscanf(s, "%d", &id); err != nil {
		return 0, false
	}
	return id, true
}

func (h *DealHandler) CreateDeal(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.CreateDealRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	deal, err := h.dealService.CreateDeal(userID, &req)
	if err != nil {
		if err == service.ErrDealUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Customer not found or access denied")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccessWithMessage(c, "Deal created successfully", deal)
}

func (h *DealHandler) UpdateDeal(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	dealID, ok := parseUint64Param(c, "id")
	if !ok {
		utils.SendError(c, http.StatusBadRequest, "Invalid deal ID")
		return
	}

	var req dto.UpdateDealRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	deal, err := h.dealService.UpdateDeal(dealID, userID, &req)
	if err != nil {
		if err == service.ErrDealNotFound {
			utils.SendError(c, http.StatusNotFound, "Deal not found")
		} else if err == service.ErrDealUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Access denied")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccessWithMessage(c, "Deal updated successfully", deal)
}

func (h *DealHandler) GetDeal(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	dealID, ok := parseUint64Param(c, "id")
	if !ok {
		utils.SendError(c, http.StatusBadRequest, "Invalid deal ID")
		return
	}

	deal, err := h.dealService.GetDealByID(dealID, userID)
	if err != nil {
		if err == service.ErrDealNotFound {
			utils.SendError(c, http.StatusNotFound, "Deal not found")
		} else if err == service.ErrDealUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Access denied")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccess(c, deal)
}

func (h *DealHandler) ListDeals(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var query dto.DealListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid query parameters")
		return
	}
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PerPage < 1 || query.PerPage > 100 {
		query.PerPage = 20
	}
	if query.SortBy == "" {
		query.SortBy = "deal_at"
	}
	if query.SortOrder == "" {
		query.SortOrder = "desc"
	}

	if cid := c.Query("customer_id"); cid != "" {
		if id, err := strconv.ParseUint(cid, 10, 64); err == nil {
			query.CustomerID = id
		}
	}

	deals, totalPages, total, err := h.dealService.ListDeals(userID, &query)
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
	utils.SendPaginated(c, deals, meta)
}

func (h *DealHandler) ListDealsByCustomerID(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	customerID, ok := parseUint64Param(c, "customerId")
	if !ok {
		utils.SendError(c, http.StatusBadRequest, "Invalid customer ID")
		return
	}

	summary, err := h.dealService.ListDealsByCustomerID(customerID, userID)
	if err != nil {
		if err == service.ErrDealUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Customer not found or access denied")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccess(c, summary)
}

func (h *DealHandler) DeleteDeal(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	dealID, ok := parseUint64Param(c, "id")
	if !ok {
		utils.SendError(c, http.StatusBadRequest, "Invalid deal ID")
		return
	}

	err := h.dealService.DeleteDeal(dealID, userID)
	if err != nil {
		if err == service.ErrDealNotFound {
			utils.SendError(c, http.StatusNotFound, "Deal not found")
		} else if err == service.ErrDealUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Access denied")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccessWithMessage(c, "Deal deleted successfully", nil)
}
