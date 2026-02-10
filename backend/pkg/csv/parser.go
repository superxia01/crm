package csv

import (
	"encoding/csv"
	"fmt"
	"io"
	"strings"
)

// CustomerRow represents a row from the CSV file
type CustomerRow struct {
	RowNumber    int
	Name        string
	Company     string
	Position    string
	Phone       string
	Email       string
	Industry    string
	Budget      string
	IntentLevel string
	Stage       string
	Source      string
	Notes       string
}

// ParseCustomersFromCSV parses customer data from a CSV file
func ParseCustomersFromCSV(reader io.Reader) ([]*CustomerRow, error) {
	r := csv.NewReader(reader)

	// Read all rows
	records, err := r.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to read CSV: %w", err)
	}

	if len(records) < 2 {
		return nil, fmt.Errorf("CSV file is empty or has no data rows")
	}

	// Parse rows
	var customers []*CustomerRow

	for i, record := range records {
		if i == 0 {
			continue // Skip header row
		}

		if len(record) < 4 {
			continue // Skip rows with insufficient data
		}

		customer := &CustomerRow{
			RowNumber: i + 1, // 1-based for user display
		}

		// Extract data from CSV columns
		// Assuming: 姓名,公司,职位,电话,邮箱,行业,预算,意向度,来源,备注
		if len(record) > 0 {
			customer.Name = strings.TrimSpace(record[0])
		}
		if len(record) > 1 {
			customer.Company = strings.TrimSpace(record[1])
		}
		if len(record) > 2 {
			customer.Position = strings.TrimSpace(record[2])
		}
		if len(record) > 3 {
			customer.Phone = strings.TrimSpace(record[3])
		}
		if len(record) > 4 {
			customer.Email = strings.TrimSpace(record[4])
		}
		if len(record) > 5 {
			customer.Industry = strings.TrimSpace(record[5])
		}
		if len(record) > 6 {
			customer.Budget = strings.TrimSpace(record[6])
		}
		if len(record) > 7 {
			customer.IntentLevel = strings.TrimSpace(record[7])
		}
		if len(record) > 8 {
			customer.Stage = strings.TrimSpace(record[8])
		}
		if len(record) > 9 {
			customer.Source = strings.TrimSpace(record[9])
		}
		if len(record) > 10 {
			customer.Notes = strings.TrimSpace(record[10])
		}

		// Skip rows without required fields
		if customer.Name == "" || customer.Company == "" || customer.Phone == "" {
			continue
		}

		customers = append(customers, customer)
	}

	if len(customers) == 0 {
		return nil, fmt.Errorf("no valid customer data found in CSV file")
	}

	return customers, nil
}
