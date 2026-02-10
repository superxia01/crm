package dto

// ImportResult represents the result of a bulk import operation
type ImportResult struct {
	Total    int              `json:"total"`
	Imported int              `json:"imported"`
	Failed   int              `json:"failed"`
	Errors   []ImportError    `json:"errors,omitempty"`
}

// ImportError represents a single row import error
type ImportError struct {
	Row   int    `json:"row"`
	Name  string `json:"name,omitempty"`
	Error string `json:"error"`
}

// ExportRequest represents a request to export customers
type ExportRequest struct {
	Format string `form:"format" binding:"required,oneof=xlsx csv"` // xlsx or csv
	IDs    string `form:"ids"`                                    // comma-separated customer IDs (optional)
}

// CustomerRow represents a single row from the import file
type CustomerRow struct {
	RowNumber    int    `json:"-"`
	Name        string `json:"name" binding:"required"`
	Company     string `json:"company" binding:"required"`
	Position    string `json:"position"`
	Phone       string `json:"phone" binding:"required"`
	Email       string `json:"email"`
	Industry    string `json:"industry"`
	Budget      string `json:"budget"`
	IntentLevel string `json:"intent_level"`
	Stage       string `json:"stage"`
	Source      string `json:"source"`
	Notes       string `json:"notes"`
}
