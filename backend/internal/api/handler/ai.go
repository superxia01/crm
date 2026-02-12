package handler

import (
	"fmt"
	"net/http"
	"io"

	"github.com/gin-gonic/gin"
	"github.com/xia/nextcrm/internal/dto"
	"github.com/xia/nextcrm/internal/service"
	"github.com/xia/nextcrm/pkg/utils"
)

type AIHandler struct {
	aiService *service.AIService
}

func NewAIHandler(aiService *service.AIService) *AIHandler {
	return &AIHandler{
		aiService: aiService,
	}
}

// GenerateScript handles generating sales scripts
func (h *AIHandler) GenerateScript(c *gin.Context) {
	var req dto.GenerateScriptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	resp, err := h.aiService.GenerateScript(&req)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SendSuccessWithMessage(c, "Script generated successfully", resp)
}

// AnalyzeCustomer handles customer analysis
func (h *AIHandler) AnalyzeCustomer(c *gin.Context) {
	id := c.Param("id")

	var customerID uint64
	if _, err := fmt.Sscanf(id, "%d", &customerID); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid customer ID")
		return
	}

	var req dto.AnalyzeCustomerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.AnalysisType = "comprehensive" // Default
	}

	// Verify customer belongs to user
	// (This would be handled by the service layer)

	resp, err := h.aiService.AnalyzeCustomer(customerID, req.AnalysisType)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SendSuccess(c, resp)
}

// GenerateEmbedding handles generating embeddings
func (h *AIHandler) GenerateEmbedding(c *gin.Context) {
	var req dto.GenerateEmbeddingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}

	resp, err := h.aiService.GenerateEmbedding(req.Text)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SendSuccess(c, resp)
}

// SpeechToText handles speech recognition
func (h *AIHandler) SpeechToText(c *gin.Context) {
	// 解析 multipart form
	fileHeader, err := c.FormFile("audio")
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid audio file: "+err.Error())
		return
	}

	if fileHeader == nil {
		utils.SendError(c, http.StatusBadRequest, "Audio file is required")
		return
	}

	// 打开文件
	file, err := fileHeader.Open()
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Failed to open audio file: "+err.Error())
		return
	}
	defer file.Close()

	// 读取音频数据
	audioData, err := io.ReadAll(file)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Failed to read audio file: "+err.Error())
		return
	}

	// 获取参数
	language := c.PostForm("language")
	if language == "" {
		language = "zh" // 默认中文
	}

	// 检测音频格式
	format := "webm" // 默认格式
	contentType := fileHeader.Header.Get("Content-Type")
	if contentType != "" {
		// 根据 Content-Type 判断格式
		if contentType == "audio/webm" || contentType == "audio/webm;codecs=opus" {
			format = "webm"
		} else if contentType == "audio/mp3" {
			format = "mp3"
		} else if contentType == "audio/wav" {
			format = "wav"
		}
	}

	// 调用服务
	result, err := h.aiService.SpeechToText(audioData, format, language)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Speech recognition failed: "+err.Error())
		return
	}

	utils.SendSuccessWithMessage(c, "Speech recognition completed", result)
}

// CustomerIntakeChat 新建客户 AI 对话（豆包）：引导填必填项，返回回复 + 解析字段 + 是否可创建
func (h *AIHandler) CustomerIntakeChat(c *gin.Context) {
	var req dto.CustomerIntakeChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid request: "+err.Error())
		return
	}
	if len(req.Messages) == 0 {
		utils.SendError(c, http.StatusBadRequest, "messages is required")
		return
	}
	if req.CurrentFields == nil {
		req.CurrentFields = make(map[string]string)
	}

	resp, err := h.aiService.CustomerIntakeChat(&req)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SendSuccess(c, resp)
}

// OCRBusinessCard handles business card OCR
func (h *AIHandler) OCRBusinessCard(c *gin.Context) {
	// 解析 multipart form
	fileHeader, err := c.FormFile("image")
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "Invalid image file: "+err.Error())
		return
	}

	if fileHeader == nil {
		utils.SendError(c, http.StatusBadRequest, "Image file is required")
		return
	}

	// 打开文件
	file, err := fileHeader.Open()
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Failed to open image file: "+err.Error())
		return
	}
	defer file.Close()

	// 读取图片数据
	imageData, err := io.ReadAll(file)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "Failed to read image file: "+err.Error())
		return
	}

	// 调用服务
	result, err := h.aiService.RecognizeBusinessCard(imageData)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "OCR failed: "+err.Error())
		return
	}

	utils.SendSuccessWithMessage(c, "Business card recognition completed", result)
}
