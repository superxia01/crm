package service

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"strings"

	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/models"
	"github.com/xia/nextcrm/internal/repository"
	"github.com/xia/nextcrm/pkg/csv"
	"github.com/xia/nextcrm/pkg/excel"
)

type ImportExportService struct {
	customerRepo *repository.CustomerRepository
}

func NewImportExportService(customerRepo *repository.CustomerRepository) *ImportExportService {
	return &ImportExportService{
		customerRepo: customerRepo,
	}
}

// ImportCustomers imports customers from Excel or CSV file
func (s *ImportExportService) ImportCustomers(userID uint64, file multipart.File, fileType string) (*dto.ImportResult, error) {
	// Read file content
	fileData, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	var rows []*dto.CustomerRow

	// Parse based on file type
	if fileType == "xlsx" || fileType == "xls" {
		excelRows, err := excel.ParseCustomersFromExcel(fileData)
		if err != nil {
			return nil, fmt.Errorf("failed to parse Excel file: %w", err)
		}
		// Convert to DTO format
		for _, row := range excelRows {
			rows = append(rows, &dto.CustomerRow{
				RowNumber:    row.RowNumber,
				Name:        row.Name,
				Company:     row.Company,
				Position:    row.Position,
				Phone:       row.Phone,
				Email:       row.Email,
				Industry:    row.Industry,
				Budget:      row.Budget,
				IntentLevel: row.IntentLevel,
				Stage:       row.Stage,
				Source:      row.Source,
				Notes:       row.Notes,
			})
		}
	} else if fileType == "csv" {
		csvRows, err := csv.ParseCustomersFromCSV(bytes.NewReader(fileData))
		if err != nil {
			return nil, fmt.Errorf("failed to parse CSV file: %w", err)
		}
		// Convert to DTO format
		for _, row := range csvRows {
			rows = append(rows, &dto.CustomerRow{
				RowNumber:    row.RowNumber,
				Name:        row.Name,
				Company:     row.Company,
				Position:    row.Position,
				Phone:       row.Phone,
				Email:       row.Email,
				Industry:    row.Industry,
				Budget:      row.Budget,
				IntentLevel: row.IntentLevel,
				Stage:       row.Stage,
				Source:      row.Source,
				Notes:       row.Notes,
			})
		}
	} else {
		return nil, fmt.Errorf("unsupported file type: %s", fileType)
	}

	// Import customers
	result := &dto.ImportResult{
		Total: len(rows),
	}

	for _, row := range rows {
		// Validate required fields
		if row.Name == "" || row.Company == "" || row.Phone == "" {
			result.Failed++
			result.Errors = append(result.Errors, dto.ImportError{
				Row:   row.RowNumber,
				Name:  row.Name,
				Error: "缺少必填字段（姓名、公司、电话）",
			})
			continue
		}

		// Validate email format if provided
		if row.Email != "" && !strings.Contains(row.Email, "@") {
			result.Failed++
			result.Errors = append(result.Errors, dto.ImportError{
				Row:   row.RowNumber,
				Name:  row.Name,
				Error: "邮箱格式无效",
			})
			continue
		}

		// Create customer
		customer := &models.Customer{
			UserID:      userID,
			Name:        row.Name,
			Company:     row.Company,
			Position:    row.Position,
			Phone:       row.Phone,
			Email:       row.Email,
			Industry:    row.Industry,
			Budget:      row.Budget,
			IntentLevel: row.IntentLevel,
			Stage:       row.Stage,
			Source:      row.Source,
			Notes:       row.Notes,
		}

		// Set defaults if empty
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
			result.Failed++
			result.Errors = append(result.Errors, dto.ImportError{
				Row:   row.RowNumber,
				Name:  row.Name,
				Error: fmt.Sprintf("创建失败: %s", err.Error()),
			})
			continue
		}

		result.Imported++
	}

	return result, nil
}

// ExportCustomersToExcel exports customers to Excel file
func (s *ImportExportService) ExportCustomersToExcel(userID uint64) ([]byte, string, error) {
	// Get all customers for user
	customers, _, err := s.customerRepo.FindByUserID(userID, &dto.CustomerQuery{
		Page:    1,
		PerPage: 10000, // Get all customers
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to fetch customers: %w", err)
	}

	// Convert to map format for Excel writer
	data := make([]map[string]string, len(customers))
	for i, customer := range customers {
		data[i] = map[string]string{
			"name":         customer.Name,
			"company":      customer.Company,
			"position":     customer.Position,
			"phone":        customer.Phone,
			"email":        customer.Email,
			"industry":     customer.Industry,
			"budget":       customer.Budget,
			"intent_level": customer.IntentLevel,
			"stage":        customer.Stage,
			"source":       customer.Source,
			"notes":        customer.Notes,
		}
	}

	// Generate Excel file
	fileData, err := excel.WriteCustomersToExcel(data)
	if err != nil {
		return nil, "", fmt.Errorf("failed to generate Excel file: %w", err)
	}

	filename := fmt.Sprintf("customers_export_%s.xlsx", formatTimestamp())

	return fileData, filename, nil
}

// ExportCustomersToCSV exports customers to CSV file
func (s *ImportExportService) ExportCustomersToCSV(userID uint64) ([]byte, string, error) {
	// Get all customers for user
	customers, _, err := s.customerRepo.FindByUserID(userID, &dto.CustomerQuery{
		Page:    1,
		PerPage: 10000,
	})
	if err != nil {
		return nil, "", fmt.Errorf("failed to fetch customers: %w", err)
	}

	// Generate CSV content
	var csvContent strings.Builder

	// Write header
	csvContent.WriteString("姓名,公司,职位,电话,邮箱,行业,预算,意向度,阶段,来源,备注\n")

	// Write data rows
	for _, customer := range customers {
		// Escape fields that contain commas or quotes
		escapeField := func(field string) string {
			if strings.Contains(field, ",") || strings.Contains(field, "\"") {
				return fmt.Sprintf("\"%s\"", strings.ReplaceAll(field, "\"", "\"\""))
			}
			return field
		}

		csvContent.WriteString(fmt.Sprintf("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n",
			escapeField(customer.Name),
			escapeField(customer.Company),
			escapeField(customer.Position),
			escapeField(customer.Phone),
			escapeField(customer.Email),
			escapeField(customer.Industry),
			escapeField(customer.Budget),
			escapeField(customer.IntentLevel),
			escapeField(customer.Stage),
			escapeField(customer.Source),
			escapeField(customer.Notes),
		))
	}

	fileData := []byte(csvContent.String())
	filename := fmt.Sprintf("customers_export_%s.csv", formatTimestamp())

	return fileData, filename, nil
}

func formatTimestamp() string {
	return "20060102_150405" // YYYYMMDD_HHMMSS
}
