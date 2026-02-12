package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/models"
	"github.com/xia/nextcrm/internal/repository"
)

var ErrDealNotFound = errors.New("deal not found")
var ErrDealUnauthorized = errors.New("deal access denied")

type DealService struct {
	dealRepo     *repository.DealRepository
	customerRepo *repository.CustomerRepository
}

func NewDealService(dealRepo *repository.DealRepository, customerRepo *repository.CustomerRepository) *DealService {
	return &DealService{
		dealRepo:     dealRepo,
		customerRepo: customerRepo,
	}
}

func (s *DealService) generateRecordNo() (string, error) {
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return fmt.Sprintf("DL%d%s", time.Now().Unix(), hex.EncodeToString(b)), nil
}

func (s *DealService) ensureCustomerBelongsToUser(customerID, userID uint64) error {
	c, err := s.customerRepo.FindByID(customerID)
	if err != nil || c == nil {
		return errors.New("customer not found")
	}
	if c.UserID != userID {
		return ErrDealUnauthorized
	}
	return nil
}

func (s *DealService) CreateDeal(userID uint64, req *dto.CreateDealRequest) (*dto.DealResponse, error) {
	if err := s.ensureCustomerBelongsToUser(req.CustomerID, userID); err != nil {
		return nil, err
	}

	recordNo, err := s.generateRecordNo()
	if err != nil {
		return nil, err
	}

	deal := &models.Deal{
		RecordNo:         recordNo,
		UserID:           userID,
		CustomerID:       req.CustomerID,
		DealType:         req.DealType,
		ProductOrService: req.ProductOrService,
		Quantity:         req.Quantity,
		Unit:             req.Unit,
		Amount:           req.Amount,
		Currency:         req.Currency,
		ContractNo:       req.ContractNo,
		SignedAt:         req.SignedAt,
		PaymentStatus:    req.PaymentStatus,
		PaidAmount:       req.PaidAmount,
		PaidAt:           req.PaidAt,
		IsRepeatPurchase: req.IsRepeatPurchase,
		DealAt:           req.DealAt,
		Notes:            req.Notes,
	}
	if deal.DealType == "" {
		deal.DealType = "sale"
	}
	if deal.Unit == "" {
		deal.Unit = "piece"
	}
	if deal.Quantity == 0 {
		deal.Quantity = 1
	}
	if deal.Currency == "" {
		deal.Currency = "CNY"
	}
	if deal.PaymentStatus == "" {
		deal.PaymentStatus = "pending"
	}

	if err := s.dealRepo.Create(deal); err != nil {
		return nil, err
	}
	return s.toResponse(deal, ""), nil
}

func (s *DealService) UpdateDeal(dealID, userID uint64, req *dto.UpdateDealRequest) (*dto.DealResponse, error) {
	deal, err := s.dealRepo.FindByID(dealID)
	if err != nil || deal == nil {
		return nil, ErrDealNotFound
	}
	if deal.UserID != userID {
		return nil, ErrDealUnauthorized
	}

	if req.DealType != nil {
		deal.DealType = *req.DealType
	}
	if req.ProductOrService != nil {
		deal.ProductOrService = *req.ProductOrService
	}
	if req.Quantity != nil {
		deal.Quantity = *req.Quantity
	}
	if req.Unit != nil {
		deal.Unit = *req.Unit
	}
	if req.Amount != nil {
		deal.Amount = *req.Amount
	}
	if req.Currency != nil {
		deal.Currency = *req.Currency
	}
	if req.ContractNo != nil {
		deal.ContractNo = *req.ContractNo
	}
	if req.SignedAt != nil {
		deal.SignedAt = req.SignedAt
	}
	if req.PaymentStatus != nil {
		deal.PaymentStatus = *req.PaymentStatus
	}
	if req.PaidAmount != nil {
		deal.PaidAmount = *req.PaidAmount
	}
	if req.PaidAt != nil {
		deal.PaidAt = req.PaidAt
	}
	if req.IsRepeatPurchase != nil {
		deal.IsRepeatPurchase = *req.IsRepeatPurchase
	}
	if req.DealAt != nil {
		deal.DealAt = *req.DealAt
	}
	if req.Notes != nil {
		deal.Notes = *req.Notes
	}

	if err := s.dealRepo.Update(deal); err != nil {
		return nil, err
	}
	return s.toResponse(deal, ""), nil
}

func (s *DealService) GetDealByID(dealID, userID uint64) (*dto.DealResponse, error) {
	deal, err := s.dealRepo.FindByID(dealID)
	if err != nil || deal == nil {
		return nil, ErrDealNotFound
	}
	if deal.UserID != userID {
		return nil, ErrDealUnauthorized
	}
	return s.toResponse(deal, ""), nil
}

func (s *DealService) ListDeals(userID uint64, query *dto.DealListQuery) ([]dto.DealResponse, int, int64, error) {
	deals, total, err := s.dealRepo.List(query, userID)
	if err != nil {
		return nil, 0, 0, err
	}
	page, perPage := query.Page, query.PerPage
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	totalPages := int((total + int64(perPage) - 1) / int64(perPage))

	resp := make([]dto.DealResponse, 0, len(deals))
	for _, d := range deals {
		resp = append(resp, *s.toResponse(d, ""))
	}
	return resp, totalPages, total, nil
}

func (s *DealService) ListDealsByCustomerID(customerID, userID uint64) (*dto.CustomerDealsSummary, error) {
	if err := s.ensureCustomerBelongsToUser(customerID, userID); err != nil {
		return nil, err
	}
	deals, err := s.dealRepo.ListByCustomerID(customerID, userID)
	if err != nil {
		return nil, err
	}

	out := &dto.CustomerDealsSummary{Deals: make([]dto.DealResponse, 0, len(deals))}
	for _, d := range deals {
		out.Deals = append(out.Deals, *s.toResponse(d, ""))
		out.TotalAmount += d.Amount
		if d.IsRepeatPurchase {
			out.RepeatCount++
		}
	}
	return out, nil
}

func (s *DealService) DeleteDeal(dealID, userID uint64) error {
	deal, err := s.dealRepo.FindByID(dealID)
	if err != nil || deal == nil {
		return ErrDealNotFound
	}
	if deal.UserID != userID {
		return ErrDealUnauthorized
	}
	return s.dealRepo.Delete(dealID)
}

func (s *DealService) toResponse(d *models.Deal, customerName string) *dto.DealResponse {
	r := &dto.DealResponse{
		ID:               d.ID,
		RecordNo:         d.RecordNo,
		UserID:           d.UserID,
		CustomerID:       d.CustomerID,
		DealType:         d.DealType,
		ProductOrService: d.ProductOrService,
		Quantity:         d.Quantity,
		Unit:             d.Unit,
		Amount:           d.Amount,
		Currency:         d.Currency,
		ContractNo:       d.ContractNo,
		SignedAt:         d.SignedAt,
		PaymentStatus:    d.PaymentStatus,
		PaidAmount:       d.PaidAmount,
		PaidAt:           d.PaidAt,
		IsRepeatPurchase: d.IsRepeatPurchase,
		DealAt:           d.DealAt,
		Notes:            d.Notes,
		CreatedAt:        d.CreatedAt,
		UpdatedAt:        d.UpdatedAt,
		CustomerName:     customerName,
	}
	return r
}
