package api

import (
	"github.com/gin-gonic/gin"
	"github.com/xia/nextcrm/internal/api/handler"
	"github.com/xia/nextcrm/internal/api/middleware"
	"github.com/xia/nextcrm/internal/config"
	"github.com/xia/nextcrm/internal/repository"
	"github.com/xia/nextcrm/internal/service"
	"github.com/xia/nextcrm/pkg/authcenter"
	"github.com/xia/nextcrm/pkg/deepseek"
	"github.com/xia/nextcrm/pkg/doubao"
	"gorm.io/gorm"
)

// SetupRouter initializes and configures the router
func SetupRouter(db *gorm.DB, cfg *config.Config) *gin.Engine {
	router := gin.Default()

	// Middleware
	router.Use(middleware.Logger())
	router.Use(middleware.CORS())

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	customerRepo := repository.NewCustomerRepository(db)
	interactionRepo := repository.NewInteractionRepository(db)
	knowledgeRepo := repository.NewKnowledgeRepository(db)
	vectorRepo := repository.NewVectorRepository(db)
	activityRepo := repository.NewActivityRepository(db)
	dealRepo := repository.NewDealRepository(db)

	// Initialize auth-center service
	authCenterService := authcenter.NewService(&authcenter.Config{
		BaseURL: "https://os.crazyaigc.com",
	})

	// Initialize JWT manager (for backward compatibility) - temporarily disabled
	// jwtManager := jwt.NewManager(cfg.JWT.Secret, cfg.JWT.ExpiryHours)

	// Initialize services
	// authService := service.NewAuthService(userRepo, jwtManager) // Disabled - using Auth Center
	customerService := service.NewCustomerService(customerRepo)
	interactionService := service.NewInteractionService(interactionRepo, customerRepo)
	importExportService := service.NewImportExportService(customerRepo)

	// Initialize DeepSeek client
	deepseekClient := deepseek.NewClient(
		cfg.DeepSeek.APIKey,
		cfg.DeepSeek.BaseURL,
		cfg.DeepSeek.Model,
		cfg.DeepSeek.EmbeddingModel,
	)

	// Initialize Doubao multimodal client
	doubaoClient := doubao.NewClient(
		cfg.Doubao.BaseURL,
		cfg.Doubao.APIKey,
		cfg.Doubao.Model,
	)

	aiService := service.NewAIService(deepseekClient, customerRepo, doubaoClient)
	knowledgeService := service.NewKnowledgeService(knowledgeRepo, vectorRepo, aiService)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authCenterService) // Re-enabled for /auth/me endpoint
	customerHandler := handler.NewCustomerHandler(customerService)
	interactionHandler := handler.NewInteractionHandler(interactionService)
	importExportHandler := handler.NewImportExportHandler(importExportService)
	knowledgeHandler := handler.NewKnowledgeHandler(knowledgeService)
	aiHandler := handler.NewAIHandler(aiService)
	dashboardHandler := handler.NewDashboardHandler(customerRepo)
	activityHandler := handler.NewActivityHandler(activityRepo, userRepo)
	dealHandler := handler.NewDealHandler(service.NewDealService(dealRepo, customerRepo))
	wechatAuthHandler := handler.NewWechatAuthHandler(authCenterService)

	// Auth middleware
	// authMiddleware := middleware.NewAuthMiddleware(jwtManager) // Disabled - using Auth Center
	authCenterMiddleware := middleware.AuthCenterMiddleware(authCenterService, userRepo)

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Auth routes (public)
		auth := v1.Group("/auth")
		{
			// auth.POST("/register", authHandler.Register) // Disabled - using Auth Center
			// auth.POST("/login", authHandler.Login) // Disabled - using Auth Center
			// WeChat login routes - use Any() to handle both GET and HEAD requests
			auth.Any("/wechat/login", wechatAuthHandler.WechatLogin)
			auth.Any("/callback", wechatAuthHandler.AuthCallback)
			auth.GET("/me", authHandler.GetMe) // Public endpoint for token verification
		}

		// Protected routes with auth-center middleware
		protected := v1.Group("")
		protected.Use(authCenterMiddleware)
		{
			// Dashboard routes
			protected.GET("/dashboard/stats", dashboardHandler.GetDashboardStats)
			protected.GET("/dashboard/funnel", dashboardHandler.GetSalesFunnel)
			protected.GET("/dashboard/activities", activityHandler.GetRecentActivities)
			protected.GET("/dashboard/revenue-history", activityHandler.GetRevenueHistory)
			protected.GET("/dashboard/pipeline-risks", activityHandler.GetPipelineRisks)

			// Activity routes
			activities := protected.Group("/activities")
			{
				activities.GET("", activityHandler.GetActivities)
				activities.POST("", activityHandler.CreateActivity)
			}

			// Deal routes (业绩管理)
			deals := protected.Group("/deals")
			{
				deals.POST("", dealHandler.CreateDeal)
				deals.GET("", dealHandler.ListDeals)
				deals.GET("/:id", dealHandler.GetDeal)
				deals.PUT("/:id", dealHandler.UpdateDeal)
				deals.DELETE("/:id", dealHandler.DeleteDeal)
			}

			// Customer routes
			customers := protected.Group("/customers")
			{
				customers.POST("", customerHandler.CreateCustomer)
				customers.GET("", customerHandler.ListCustomers)
				customers.GET("/:customerId", customerHandler.GetCustomer)
				customers.PUT("/:customerId", customerHandler.UpdateCustomer)
				customers.DELETE("/:customerId", customerHandler.DeleteCustomer)
				customers.POST("/:customerId/follow-up", customerHandler.IncrementFollowUp)

				// Customer deals (业绩记录)
				customers.GET("/:customerId/deals", dealHandler.ListDealsByCustomerID)

				// Archive routes
				customers.POST("/:customerId/archive", customerHandler.ArchiveCustomer)
				customers.POST("/:customerId/restore", customerHandler.RestoreCustomer)
				customers.GET("/archived", customerHandler.ListArchivedCustomers)

				// Import/Export routes
				customers.POST("/import", importExportHandler.ImportCustomers)
				customers.GET("/export", importExportHandler.ExportCustomers)
				customers.GET("/template", importExportHandler.GetImportTemplate)

				// Interaction routes (nested under customers)
				customers.POST("/:customerId/interactions", interactionHandler.CreateInteraction)
				customers.GET("/:customerId/interactions", interactionHandler.GetInteractionsByCustomerID)
			}

			// Interaction routes
			interactions := protected.Group("/interactions")
			{
				interactions.GET("/upcoming", interactionHandler.GetUpcomingInteractions)
				interactions.GET("/:id", interactionHandler.GetInteraction)
				interactions.PUT("/:id", interactionHandler.UpdateInteraction)
				interactions.DELETE("/:id", interactionHandler.DeleteInteraction)
			}

			// Knowledge base routes
			knowledge := protected.Group("/knowledge")
			{
				knowledge.POST("", knowledgeHandler.CreateKnowledge)
				knowledge.GET("", knowledgeHandler.ListKnowledge)
				knowledge.GET("/:id", knowledgeHandler.GetKnowledge)
				knowledge.PUT("/:id", knowledgeHandler.UpdateKnowledge)
				knowledge.DELETE("/:id", knowledgeHandler.DeleteKnowledge)
				knowledge.POST("/search", knowledgeHandler.SearchKnowledge)
			}

			// AI routes
			ai := protected.Group("/ai")
			{
				ai.POST("/scripts/generate", aiHandler.GenerateScript)
				ai.POST("/customers/:id/analyze", aiHandler.AnalyzeCustomer)
				ai.POST("/knowledge/embed", aiHandler.GenerateEmbedding)
				ai.POST("/speech-to-text", aiHandler.SpeechToText)
				ai.POST("/ocr-card", aiHandler.OCRBusinessCard)
				ai.POST("/customer-intake/chat", aiHandler.CustomerIntakeChat)
			}
		}
	}

	return router
}
