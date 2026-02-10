package service

import (
	"errors"
	"time"

	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/models"
	"github.com/xia/nextcrm/internal/repository"
)

var (
	ErrInteractionNotFound = errors.New("interaction not found")
	// ErrUnauthorized is declared in customer.go
)

type InteractionService struct {
	interactionRepo *repository.InteractionRepository
	customerRepo    *repository.CustomerRepository
}

func NewInteractionService(
	interactionRepo *repository.InteractionRepository,
	customerRepo *repository.CustomerRepository,
) *InteractionService {
	return &InteractionService{
		interactionRepo: interactionRepo,
		customerRepo:    customerRepo,
	}
}

// CreateInteraction creates a new interaction
func (s *InteractionService) CreateInteraction(userID uint64, req *dto.CreateInteractionRequest) (*dto.InteractionResponse, error) {
	// Verify customer belongs to user
	customer, err := s.customerRepo.FindByID(req.CustomerID)
	if err != nil {
		return nil, ErrInteractionNotFound
	}
	if customer.UserID != userID {
		return nil, ErrUnauthorized
	}

	interaction := &models.Interaction{
		UserID:     userID,
		CustomerID: req.CustomerID,
		Type:       req.Type,
		Content:    req.Content,
		Outcome:    req.Outcome,
		NextAction: req.NextAction,
		NextDate:   req.NextDate,
	}

	if err := s.interactionRepo.Create(interaction); err != nil {
		return nil, err
	}

	return s.toInteractionResponse(interaction, customer), nil
}

// GetInteractionByID retrieves an interaction by ID
func (s *InteractionService) GetInteractionByID(id, userID uint64) (*dto.InteractionResponse, error) {
	interaction, err := s.interactionRepo.FindByID(id)
	if err != nil {
		return nil, ErrInteractionNotFound
	}

	// Verify ownership
	if interaction.UserID != userID {
		return nil, ErrUnauthorized
	}

	customer, _ := s.customerRepo.FindByID(interaction.CustomerID)
	return s.toInteractionResponse(interaction, customer), nil
}

// GetInteractionsByCustomerID retrieves all interactions for a customer
func (s *InteractionService) GetInteractionsByCustomerID(customerID, userID uint64) ([]*dto.InteractionResponse, error) {
	// Verify customer belongs to user
	customer, err := s.customerRepo.FindByID(customerID)
	if err != nil {
		return nil, ErrInteractionNotFound
	}
	if customer.UserID != userID {
		return nil, ErrUnauthorized
	}

	interactions, err := s.interactionRepo.FindByCustomerIDAndUserID(customerID, userID)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.InteractionResponse, len(interactions))
	for i, interaction := range interactions {
		responses[i] = s.toInteractionResponse(interaction, customer)
	}

	return responses, nil
}

// UpdateInteraction updates an existing interaction
func (s *InteractionService) UpdateInteraction(id, userID uint64, req *dto.UpdateInteractionRequest) (*dto.InteractionResponse, error) {
	interaction, err := s.interactionRepo.FindByID(id)
	if err != nil {
		return nil, ErrInteractionNotFound
	}

	// Verify ownership
	if interaction.UserID != userID {
		return nil, ErrUnauthorized
	}

	// Update fields
	if req.Type != "" {
		interaction.Type = req.Type
	}
	if req.Content != "" {
		interaction.Content = req.Content
	}
	if req.Outcome != "" {
		interaction.Outcome = req.Outcome
	}
	if req.NextAction != "" {
		interaction.NextAction = req.NextAction
	}
	if req.NextDate != nil {
		interaction.NextDate = req.NextDate
	}

	if err := s.interactionRepo.Update(interaction); err != nil {
		return nil, err
	}

	customer, _ := s.customerRepo.FindByID(interaction.CustomerID)
	return s.toInteractionResponse(interaction, customer), nil
}

// DeleteInteraction deletes an interaction
func (s *InteractionService) DeleteInteraction(id, userID uint64) error {
	interaction, err := s.interactionRepo.FindByID(id)
	if err != nil {
		return ErrInteractionNotFound
	}

	// Verify ownership
	if interaction.UserID != userID {
		return ErrUnauthorized
	}

	return s.interactionRepo.Delete(id)
}

// GetUpcomingInteractions retrieves upcoming interactions for a user
func (s *InteractionService) GetUpcomingInteractions(userID uint64, fromDate time.Time) ([]*dto.InteractionResponse, error) {
	interactions, err := s.interactionRepo.FindUpcoming(userID, fromDate)
	if err != nil {
		return nil, err
	}

	responses := make([]*dto.InteractionResponse, len(interactions))
	for i, interaction := range interactions {
		customer, _ := s.customerRepo.FindByID(interaction.CustomerID)
		responses[i] = s.toInteractionResponse(interaction, customer)
	}

	return responses, nil
}

// Helper function to convert model to response
func (s *InteractionService) toInteractionResponse(interaction *models.Interaction, customer *models.Customer) *dto.InteractionResponse {
	response := &dto.InteractionResponse{
		ID:         interaction.ID,
		CustomerID: interaction.CustomerID,
		Type:       interaction.Type,
		Content:    interaction.Content,
		Outcome:    interaction.Outcome,
		NextAction: interaction.NextAction,
		NextDate:   interaction.NextDate,
		CreatedAt:  interaction.CreatedAt,
		UpdatedAt:  interaction.UpdatedAt,
	}

	if customer != nil {
		response.Customer = &dto.CustomerSummary{
			ID:      customer.ID,
			Name:    customer.Name,
			Company: customer.Company,
		}
	}

	return response
}
