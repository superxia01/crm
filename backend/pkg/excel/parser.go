package excel

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/xuri/excelize/v2"
)

// CustomerRow represents a row from the Excel file
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

// ParseCustomersFromExcel parses customer data from an Excel file
func ParseCustomersFromExcel(fileData []byte) ([]*CustomerRow, error) {
	f, err := excelize.OpenReader(bytes.NewReader(fileData))
	if err != nil {
		return nil, fmt.Errorf("failed to open Excel file: %w", err)
	}
	defer f.Close()

	// Get the first sheet
	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("Excel file has no sheets")
	}

	// Read all rows from the first sheet
	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, fmt.Errorf("failed to read rows: %w", err)
	}

	if len(rows) < 2 {
		return nil, fmt.Errorf("Excel file is empty or has no data rows")
	}

	// Expected column mapping (adjust based on your Excel template)
	// Assuming columns: 姓名, 公司, 职位, 电话, 邮箱, 行业, 预算, 意向度, 来源, 备注
	// We'll try to detect columns by name

	var customers []*CustomerRow

	// Skip header row (first row)
	for i, row := range rows {
		if i == 0 {
			continue // Skip header
		}

		if len(row) < 4 {
			continue // Skip rows with insufficient data
		}

		customer := &CustomerRow{
			RowNumber: i + 1, // 1-based for user display
		}

		// Extract data (assuming fixed column positions)
		// Adjust column indices based on your Excel template
		if len(row) > 0 {
			customer.Name = strings.TrimSpace(row[0])
		}
		if len(row) > 1 {
			customer.Company = strings.TrimSpace(row[1])
		}
		if len(row) > 2 {
			customer.Position = strings.TrimSpace(row[2])
		}
		if len(row) > 3 {
			customer.Phone = strings.TrimSpace(row[3])
		}
		if len(row) > 4 {
			customer.Email = strings.TrimSpace(row[4])
		}
		if len(row) > 5 {
			customer.Industry = strings.TrimSpace(row[5])
		}
		if len(row) > 6 {
			customer.Budget = strings.TrimSpace(row[6])
		}
		if len(row) > 7 {
			customer.IntentLevel = strings.TrimSpace(row[7])
		}
		if len(row) > 8 {
			customer.Stage = strings.TrimSpace(row[8])
		}
		if len(row) > 9 {
			customer.Source = strings.TrimSpace(row[9])
		}
		if len(row) > 10 {
			customer.Notes = strings.TrimSpace(row[10])
		}

		// Skip rows without required fields
		if customer.Name == "" || customer.Company == "" || customer.Phone == "" {
			continue
		}

		customers = append(customers, customer)
	}

	if len(customers) == 0 {
		return nil, fmt.Errorf("no valid customer data found in Excel file")
	}

	return customers, nil
}

// WriteCustomersToExcel writes customers to an Excel file
func WriteCustomersToExcel(customers []map[string]string) ([]byte, error) {
	f := excelize.NewFile()
	defer f.Close()

	// Create a new sheet
	sheetName := "Customers"
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, err
	}

	// Set headers
	headers := []string{"姓名", "公司", "职位", "电话", "邮箱", "行业", "预算", "意向度", "阶段", "来源", "备注"}
	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheetName, cell, header)
		// Set header style
		style, _ := f.NewStyle(&excelize.Style{
			Font: &excelize.Font{Bold: true},
			Fill: excelize.Fill{Type: "pattern", Pattern: 1, Color: []string{"#E0E0E0"}},
		})
		f.SetCellStyle(sheetName, cell, cell, style)
	}

	// Write data rows
	for i, customer := range customers {
		rowNum := i + 2 // Start from row 2 (row 1 is headers)

		f.SetCellValue(sheetName, fmt.Sprintf("A%d", rowNum), customer["name"])
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", rowNum), customer["company"])
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", rowNum), customer["position"])
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", rowNum), customer["phone"])
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", rowNum), customer["email"])
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", rowNum), customer["industry"])
		f.SetCellValue(sheetName, fmt.Sprintf("G%d", rowNum), customer["budget"])
		f.SetCellValue(sheetName, fmt.Sprintf("H%d", rowNum), customer["intent_level"])
		f.SetCellValue(sheetName, fmt.Sprintf("I%d", rowNum), customer["stage"])
		f.SetCellValue(sheetName, fmt.Sprintf("J%d", rowNum), customer["source"])
		f.SetCellValue(sheetName, fmt.Sprintf("K%d", rowNum), customer["notes"])
	}

	// Set column widths
	f.SetColWidth(sheetName, "A", "K", 15)

	// Set active sheet
	f.SetActiveSheet(index)

	// Write to buffer
	buffer, err := f.WriteToBuffer()
	if err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

// ParseColumnIndex converts Excel column letter to index (A=0, B=1, etc.)
func ParseColumnIndex(col string) int {
	col = strings.ToUpper(col)
	result := 0
	for _, ch := range col {
		if ch >= 'A' && ch <= 'Z' {
			result = result*26 + int(ch-'A') + 1
		}
	}
	return result - 1
}

// ColumnIndexToLetter converts column index to letter (0=A, 1=B, etc.)
func ColumnIndexToLetter(index int) string {
	return string(rune('A' + index))
}
