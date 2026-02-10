package handler

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/xia/nextcrm/internal/api/middleware"
	"github.com/xia/nextcrm/internal/service"
	"github.com/xia/nextcrm/pkg/utils"
)

type ImportExportHandler struct {
	importExportService *service.ImportExportService
}

func NewImportExportHandler(importExportService *service.ImportExportService) *ImportExportHandler {
	return &ImportExportHandler{
		importExportService: importExportService,
	}
}

// ImportCustomers handles importing customers from Excel/CSV
func (h *ImportExportHandler) ImportCustomers(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	// Get uploaded file
	fileHeader, err := c.FormFile("file")
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "文件上传失败: "+err.Error())
		return
	}

	if fileHeader == nil {
		utils.SendError(c, http.StatusBadRequest, "请选择文件")
		return
	}

	// Determine file type from extension
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	var fileType string
	switch ext {
	case ".xlsx", ".xls":
		fileType = "xlsx"
	case ".csv":
		fileType = "csv"
	default:
		utils.SendError(c, http.StatusBadRequest, "不支持的文件类型，请上传 Excel (.xlsx, .xls) 或 CSV 文件")
		return
	}

	// Open file
	file, err := fileHeader.Open()
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "打开文件失败: "+err.Error())
		return
	}
	defer file.Close()

	// Import customers
	result, err := h.importExportService.ImportCustomers(userID, file, fileType)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SendSuccessWithMessage(c,
		fmt.Sprintf("导入完成！共 %d 条数据，成功 %d 条，失败 %d 条", result.Total, result.Imported, result.Failed),
		result)
}

// ExportCustomers exports customers to Excel or CSV
func (h *ImportExportHandler) ExportCustomers(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var format string
	if format = c.Query("format"); format == "" {
		format = "xlsx" // Default to Excel
	}

	if format != "xlsx" && format != "csv" {
		utils.SendError(c, http.StatusBadRequest, "不支持的导出格式，请选择 xlsx 或 csv")
		return
	}

	var fileData []byte
	var filename string
	var err error

	if format == "xlsx" {
		fileData, filename, err = h.importExportService.ExportCustomersToExcel(userID)
	} else {
		fileData, filename, err = h.importExportService.ExportCustomersToCSV(userID)
	}

	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "导出失败: "+err.Error())
		return
	}

	// Set headers for file download
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/octet-stream")

	c.Data(http.StatusOK, "application/octet-stream", fileData)
}

// GetImportTemplate returns a template file for import
func (h *ImportExportHandler) GetImportTemplate(c *gin.Context) {
	format := c.Query("format")
	if format == "" || format == "xlsx" {
		// Return Excel template
		templateData := []byte(`姓名	公司	职位	电话	邮箱	行业	预算	意向度	阶段	来源	备注
张三	ABC公司	经理	13800138000	zhangsan@abc.com	SaaS	50k	High	LinkedIn	示例数据
李四	XYZ科技	总监	13900139000	lisi@xyz.com	科技	100k	Medium	Website	`)
		filename := "customers_import_template.xlsx"

		c.Header("Content-Description", "File Transfer")
		c.Header("Content-Transfer-Encoding", "binary")
		c.Header("Content-Disposition", "attachment; filename="+filename)
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

		c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", templateData)
	} else if format == "csv" {
		// Return CSV template
		templateData := []byte(`姓名,公司,职位,电话,邮箱,行业,预算,意向度,阶段,来源,备注
张三,ABC公司,经理,13800138000,zhangsan@abc.com,SaaS,50k,High,LinkedIn,示例数据
李四,XYZ科技,总监,13900139000,lisi@xyz.com,科技,100k,Medium,Website,`)
		filename := "customers_import_template.csv"

		c.Header("Content-Description", "File Transfer")
		c.Header("Content-Transfer-Encoding", "binary")
		c.Header("Content-Disposition", "attachment; filename="+filename)
		c.Header("Content-Type", "text/csv")

		c.Data(http.StatusOK, "text/csv", templateData)
	} else {
		utils.SendError(c, http.StatusBadRequest, "不支持的模板格式")
	}
}
