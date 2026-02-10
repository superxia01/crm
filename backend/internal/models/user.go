package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// UserProfile stores user profile information from auth-center
type UserProfile struct {
	Nickname  string `json:"nickname"`
	AvatarURL string `json:"avatarUrl"`
}

// Scan implements sql.Scanner for UserProfile
func (p *UserProfile) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, p)
}

// Value implements driver.Valuer for UserProfile
func (p UserProfile) Value() (driver.Value, error) {
	return json.Marshal(p)
}

// User represents a user in the system
type User struct {
	ID                 uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	AuthCenterUserID   string         `gorm:"uniqueIndex;not null;type:varchar(255)" json:"auth_center_user_id"`
	UnionID            *string        `gorm:"index;type:varchar(255)" json:"unionId,omitempty"`
	Email              *string        `gorm:"index" json:"email,omitempty"`
	PhoneNumber        *string        `json:"phoneNumber,omitempty"`
	Name               *string        `json:"name,omitempty"`
	Nickname           *string        `json:"nickname,omitempty"`
	AvatarURL          *string        `json:"avatarUrl,omitempty"`
	Profile            *UserProfile   `gorm:"type:jsonb" json:"profile,omitempty"`
	Role               string         `gorm:"default:'USER'" json:"role"`
	IsActive           bool           `gorm:"default:true" json:"is_active"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}
