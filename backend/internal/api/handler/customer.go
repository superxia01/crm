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

type CustomerHandler struct {
	customerService *service.CustomerService
}

func NewCustomerHandler(customerService *service.CustomerService) *CustomerHandler {
	return &CustomerHandler{
		customerService: customerService,
	}
}

// CreateCustomer handles customer creation
func (h *CustomerHandler) CreateCustomer(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req dto.CreateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	customer, err := h.customerService.CreateCustomer(userID, &req)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SendSuccessWithMessage(c, "Customer created successfully", customer)
}

// GetCustomer handles getting a customer by ID
func (h *CustomerHandler) GetCustomer(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var customerID uint64
	if _, err := fmt.Sscanf(id, "%d", &customerID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid customer ID")
		return
	}

	customer, err := h.customerService.GetCustomerByID(customerID, userID)
	if err != nil {
		if err == service.ErrUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Access denied")
		} else {
			utils.SendError(c, http.StatusNotFound, "Customer not found")
		}
		return
	}

	utils.SendSuccess(c, customer)
}

// ListCustomers handles listing customers
func (h *CustomerHandler) ListCustomers(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var query dto.CustomerQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid query parameters")
		return
	}

	customers, totalPages, total, err := h.customerService.ListCustomers(userID, &query)
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

	utils.SendPaginated(c, customers, meta)
}

// UpdateCustomer handles updating a customer
func (h *CustomerHandler) UpdateCustomer(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var customerID uint64
	if _, err := fmt.Sscanf(id, "%d", &customerID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid customer ID")
		return
	}

	var req dto.UpdateCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	customer, err := h.customerService.UpdateCustomer(customerID, userID, &req)
	if err != nil {
		if err == service.ErrUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Access denied")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccessWithMessage(c, "Customer updated successfully", customer)
}

// DeleteCustomer handles deleting a customer
func (h *CustomerHandler) DeleteCustomer(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var customerID uint64
	if _, err := fmt.Sscanf(id, "%d", &customerID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid customer ID")
		return
	}

	err := h.customerService.DeleteCustomer(customerID, userID)
	if err != nil {
		if err == service.ErrUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Access denied")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccessWithMessage(c, "Customer deleted successfully", nil)
}

// IncrementFollowUp handles incrementing follow-up count
func (h *CustomerHandler) IncrementFollowUp(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var customerID uint64
	if _, err := fmt.Sscanf(id, "%d", &customerID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid customer ID")
		return
	}

	err := h.customerService.IncrementFollowUp(customerID, userID)
	if err != nil {
		if err == service.ErrUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Access denied")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccessWithMessage(c, "Follow-up count incremented", nil)
}

// ArchiveCustomer handles archiving a customer (soft delete)
func (h *CustomerHandler) ArchiveCustomer(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var customerID uint64
	if _, err := fmt.Sscanf(id, "%d", &customerID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid customer ID")
		return
	}

	err := h.customerService.ArchiveCustomer(customerID, userID)
	if err != nil {
		if err == service.ErrUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Access denied")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccessWithMessage(c, "客户已归档", nil)
}

// RestoreCustomer handles restoring an archived customer
func (h *CustomerHandler) RestoreCustomer(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	id := c.Param("id")

	var customerID uint64
	if _, err := fmt.Sscanf(id, "%d", &customerID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid customer ID")
		return
	}

	customer, err := h.customerService.RestoreCustomer(customerID, userID)
	if err != nil {
		if err == service.ErrUnauthorized {
			utils.SendError(c, http.StatusForbidden, "Access denied")
		} else {
			utils.SendError(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	utils.SendSuccessWithMessage(c, "客户已恢复", customer)
}

// ListArchivedCustomers handles listing archived customers
func (h *CustomerHandler) ListArchivedCustomers(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var query dto.CustomerQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid query parameters")
		return
	}

	customers, totalPages, total, err := h.customerService.ListArchivedCustomers(userID, &query)
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

	utils.SendPaginated(c, customers, meta)
}
