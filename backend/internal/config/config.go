package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Server    ServerConfig
	Database  DatabaseConfig
	JWT       JWTConfig
	DeepSeek  DeepSeekConfig
	Doubao    DoubaoConfig
	VolcEngine VolcEngineConfig
}

type ServerConfig struct {
	Port string
	Env  string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type JWTConfig struct {
	Secret     string
	ExpiryHours int
}

type DeepSeekConfig struct {
	APIKey      string
	BaseURL     string
	Model       string
	EmbeddingModel string
}

type DoubaoConfig struct {
	APIKey  string
	BaseURL string
	Model   string
}

type VolcEngineConfig struct {
	AccessKeyID     string
	AccessKeySecret string
	Region          string
	ASR             VolcEngineASRConfig
	OCR             VolcEngineOCRConfig
}

type VolcEngineASRConfig struct {
	AppID string
	UID   string
}

type VolcEngineOCRConfig struct {
	AppID string
}

func Load() (*Config, error) {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		// .env file is optional in production
	}

	cfg := &Config{
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
			Env:  getEnv("SERVER_ENV", "development"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "nextcrm"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		JWT: JWTConfig{
			Secret:     getEnv("JWT_SECRET", "your-secret-key-change-this"),
			ExpiryHours: getEnvAsInt("JWT_EXPIRY_HOURS", 24),
		},
		DeepSeek: DeepSeekConfig{
			APIKey:        getEnv("DEEPSEEK_API_KEY", ""),
			BaseURL:       getEnv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
			Model:         getEnv("DEEPSEEK_MODEL", "deepseek-chat"),
			EmbeddingModel: getEnv("DEEPSEEK_EMBEDDING_MODEL", "deepseek-embedding"),
		},
		Doubao: DoubaoConfig{
			APIKey:  getEnv("DOUBAO_API_KEY", ""),
			BaseURL: getEnv("DOUBAO_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3"),
			Model:   getEnv("DOUBAO_MODEL", "doubao-seed-1-8-251228"),
		},
		VolcEngine: VolcEngineConfig{
			AccessKeyID:     getEnv("VOLCENGINE_ACCESS_KEY_ID", ""),
			AccessKeySecret: getEnv("VOLCENGINE_ACCESS_KEY_SECRET", ""),
			Region:          getEnv("VOLCENGINE_REGION", "cn-north-1"),
			ASR: VolcEngineASRConfig{
				AppID: getEnv("VOLCENGINE_ASR_APP_ID", ""),
				UID:   getEnv("VOLCENGINE_ASR_UID", "nextcrm_user"),
			},
			OCR: VolcEngineOCRConfig{
				AppID: getEnv("VOLCENGINE_OCR_APP_ID", ""),
			},
		},
	}

	return cfg, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
