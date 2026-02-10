package main

import (
	"log"

	"github.com/xia/nextcrm/internal/config"
	"github.com/xia/nextcrm/internal/models"
	"github.com/xia/nextcrm/pkg/database"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := database.Connect(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Seed users
	log.Println("Seeding users...")
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	adminUser := &models.User{
		Email:        "admin@nextcrm.com",
		Name:         "Admin User",
		PasswordHash: string(passwordHash),
		Role:         "ADMIN",
		IsActive:     true,
	}
	db.FirstOrCreate(adminUser, models.User{Email: adminUser.Email})

	// Seed demo user
	passwordHash2, _ := bcrypt.GenerateFromPassword([]byte("demo123"), bcrypt.DefaultCost)
	demoUser := &models.User{
		Email:        "demo@nextcrm.com",
		Name:         "Demo User",
		PasswordHash: string(passwordHash2),
		Role:         "USER",
		IsActive:     true,
	}
	db.FirstOrCreate(demoUser, models.User{Email: demoUser.Email})

	log.Println("Seeding completed successfully")
}
