package service

import (
	"errors"

	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/models"
	"github.com/xia/nextcrm/internal/repository"
)

type CustomerService struct {
	customerRepo *repository.CustomerRepository
}

func NewCustomerService(customerRepo *repository.CustomerRepository) *CustomerService {
	return &CustomerService{
		customerRepo: customerRepo,
	}
}

// CreateCustomer creates a new customer
func (s *CustomerService) CreateCustomer(userID uint64, req *dto.CreateCustomerRequest) (*dto.CustomerResponse, error) {
	customer := &models.Customer{
		UserID:            userID,
		Name:              req.Name,
		Company:           req.Company,
		Position:          req.Position,
		Phone:             req.Phone,
		Email:             req.Email,
		Industry:          req.Industry,
		Budget:            req.Budget,
		IntentLevel:       req.IntentLevel,
		Stage:             req.Stage,
		Source:            req.Source,
		ContractValue:     req.ContractValue,
		ContractStatus:    req.ContractStatus,
		ExpectedCloseDate: req.ExpectedCloseDate,
		Probability:       req.Probability,
		AnnualRevenue:     req.AnnualRevenue,
		Notes:             req.Notes,
	}

	// Set defaults
	if customer.IntentLevel == "" {
		customer.IntentLevel = "Medium"
	}
	if customer.Stage == "" {
		customer.Stage = "Leads"
	}
	if customer.Source == "" {
		customer.Source = "Manual"
	}

	if err := s.customerRepo.Create(customer); err != nil {
		return nil, err
	}

	return s.toResponse(customer), nil
}

// GetCustomerByID retrieves a customer by ID
func (s *CustomerService) GetCustomerByID(id, userID uint64) (*dto.CustomerResponse, error) {
	customer, err := s.customerRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// Check if customer belongs to user
	if customer.UserID != userID {
		return nil, ErrUnauthorized
	}

	return s.toResponse(customer), nil
}

// ListCustomers retrieves customers with pagination and filters
func (s *CustomerService) ListCustomers(userID uint64, query *dto.CustomerQuery) ([]*dto.CustomerResponse, int, int64, error) {
	customers, total, err := s.customerRepo.FindByUserID(userID, query)
	if err != nil {
		return nil, 0, 0, err
	}

	responses := make([]*dto.CustomerResponse, len(customers))
	for i, customer := range customers {
		responses[i] = s.toResponse(customer)
	}

	totalPages := int(total) / query.PerPage
	if int(total)%query.PerPage > 0 {
		totalPages++
	}

	return responses, totalPages, total, nil
}

// UpdateCustomer updates a customer
func (s *CustomerService) UpdateCustomer(id, userID uint64, req *dto.UpdateCustomerRequest) (*dto.CustomerResponse, error) {
	customer, err := s.customerRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// Check if customer belongs to user
	if customer.UserID != userID {
		return nil, ErrUnauthorized
	}

	// Update fields
	if req.Name != nil {
		customer.Name = *req.Name
	}
	if req.Company != nil {
		customer.Company = *req.Company
	}
	if req.Position != nil {
		customer.Position = *req.Position
	}
	if req.Phone != nil {
		customer.Phone = *req.Phone
	}
	if req.Email != nil {
		customer.Email = *req.Email
	}
	if req.Industry != nil {
		customer.Industry = *req.Industry
	}
	if req.Budget != nil {
		customer.Budget = *req.Budget
	}
	if req.IntentLevel != nil {
		customer.IntentLevel = *req.IntentLevel
	}
	if req.Stage != nil {
		customer.Stage = *req.Stage
	}
	if req.Source != nil {
		customer.Source = *req.Source
	}
	if req.FollowUpCount != nil {
		customer.FollowUpCount = *req.FollowUpCount
	}
	if req.ContractValue != nil {
		customer.ContractValue = *req.ContractValue
	}
	if req.ContractStatus != nil {
		customer.ContractStatus = *req.ContractStatus
	}
	if req.ContractStartDate != nil {
		customer.ContractStartDate = req.ContractStartDate
	}
	if req.ContractEndDate != nil {
		customer.ContractEndDate = req.ContractEndDate
	}
	if req.ExpectedCloseDate != nil {
		customer.ExpectedCloseDate = req.ExpectedCloseDate
	}
	if req.Probability != nil {
		customer.Probability = *req.Probability
	}
	if req.AnnualRevenue != nil {
		customer.AnnualRevenue = *req.AnnualRevenue
	}
	if req.Notes != nil {
		customer.Notes = *req.Notes
	}
	if req.LastContact != nil {
		customer.LastContact = req.LastContact
	}

	if err := s.customerRepo.Update(customer); err != nil {
		return nil, err
	}

	return s.toResponse(customer), nil
}

// DeleteCustomer deletes a customer
func (s *CustomerService) DeleteCustomer(id, userID uint64) error {
	customer, err := s.customerRepo.FindByID(id)
	if err != nil {
		return err
	}

	// Check if customer belongs to user
	if customer.UserID != userID {
		return ErrUnauthorized
	}

	return s.customerRepo.Delete(id)
}

// IncrementFollowUp increments the follow-up count
func (s *CustomerService) IncrementFollowUp(id, userID uint64) error {
	customer, err := s.customerRepo.FindByID(id)
	if err != nil {
		return err
	}

	// Check if customer belongs to user
	if customer.UserID != userID {
		return ErrUnauthorized
	}

	return s.customerRepo.IncrementFollowUpCount(id)
}

// ArchiveCustomer archives a customer (soft delete)
func (s *CustomerService) ArchiveCustomer(id, userID uint64) error {
	customer, err := s.customerRepo.FindByID(id)
	if err != nil {
		return err
	}

	// Check if customer belongs to user
	if customer.UserID != userID {
		return ErrUnauthorized
	}

	return s.customerRepo.SoftDelete(id)
}

// RestoreCustomer restores an archived customer
func (s *CustomerService) RestoreCustomer(id, userID uint64) (*dto.CustomerResponse, error) {
	customer, err := s.customerRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	// Check if customer belongs to user
	if customer.UserID != userID {
		return nil, ErrUnauthorized
	}

	if err := s.customerRepo.Restore(id); err != nil {
		return nil, err
	}

	// Fetch the restored customer
	customer, err = s.customerRepo.FindByID(id)
	if err != nil {
		return nil, err
	}

	return s.toResponse(customer), nil
}

// ListArchivedCustomers retrieves archived customers with pagination
func (s *CustomerService) ListArchivedCustomers(userID uint64, query *dto.CustomerQuery) ([]*dto.CustomerResponse, int, int64, error) {
	customers, total, err := s.customerRepo.FindArchivedByUserID(userID, query)
	if err != nil {
		return nil, 0, 0, err
	}

	responses := make([]*dto.CustomerResponse, len(customers))
	for i, customer := range customers {
		responses[i] = s.toResponse(customer)
	}

	totalPages := int(total) / query.PerPage
	if int(total)%query.PerPage > 0 {
		totalPages++
	}

	return responses, totalPages, total, nil
}

func (s *CustomerService) toResponse(customer *models.Customer) *dto.CustomerResponse {
	return &dto.CustomerResponse{
		ID:                customer.ID,
		UserID:            customer.UserID,
		Name:              customer.Name,
		Company:           customer.Company,
		Position:          customer.Position,
		Phone:             customer.Phone,
		Email:             customer.Email,
		Industry:          customer.Industry,
		Budget:            customer.Budget,
		IntentLevel:       customer.IntentLevel,
		Stage:             customer.Stage,
		Source:            customer.Source,
		FollowUpCount:     customer.FollowUpCount,
		ContractValue:     customer.ContractValue,
		ContractStatus:    customer.ContractStatus,
		ContractStartDate: customer.ContractStartDate,
		ContractEndDate:   customer.ContractEndDate,
		ExpectedCloseDate: customer.ExpectedCloseDate,
		Probability:       customer.Probability,
		AnnualRevenue:     customer.AnnualRevenue,
		Notes:             customer.Notes,
		LastContact:       customer.LastContact,
		CreatedAt:         customer.CreatedAt,
		UpdatedAt:         customer.UpdatedAt,
	}
}

var ErrUnauthorized = errors.New("unauthorized")
