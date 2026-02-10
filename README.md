# nextCRM Fullstack

A full-stack CRM application with AI-powered features, built with Go backend and React frontend.

## 🌟 Features

### Core Functionality
- **User Authentication**: JWT-based secure authentication system
- **Customer Management**: Complete CRUD operations with advanced filtering and search
  - Create, view, edit, and delete customers
  - Advanced search and filtering (stage, intent level, source, industry)
  - Table and kanban board views
  - Follow-up tracking with detailed history
- **AI-Powered Features**:
  - **Sales Scripts**: Generate sales scripts using Doubao multimodal AI
  - **Customer Analysis**: AI-driven customer insights and recommendations
  - **Voice Recognition**: Speech-to-text using Doubao
  - **Business Card OCR**: Automatic card information extraction
- **Knowledge Base**: Vector semantic search using pgvector
- **Modern UI**: Responsive React interface with Tailwind CSS
- **Toast Notifications**: Modern, non-blocking notification system

### Recent Enhancements (Priority 1)
- ✅ **Customer Edit Page**: Full-featured customer editing with all fields
- ✅ **Follow-up Records**: Track customer interactions with multiple input modes
  - Form input, chat interface, voice recording, text import
  - Local storage for detailed history
  - Auto-refresh customer data
- ✅ **Toast Notification System**: Beautiful, animated notifications
  - Success, error, info, and warning types
  - Auto-dismiss with configurable duration
  - Stacked notifications support

### 🆕 AI Features (Doubao Multimodal + DeepSeek Fallback)
- ✅ **对话功能**: 使用豆包多模态大模型
  - 话术生成、客户分析
  - DeepSeek 自动降级备份
- ✅ **语音识别**: Convert voice to text for quick input
  - Real-time recording with timer
  - Multi-language support
  - Automatic form filling
- ✅ **Business Card OCR**: Scan and extract card information
  - Camera integration for mobile
  - Auto-fill customer data
  - High accuracy recognition

## 🏗️ Architecture

```
nextcrm-fullstack/
├── frontend/          # React 19 + Vite + Tailwind CSS
├── backend/           # Go 1.21 + Gin + GORM + PostgreSQL
├── docker-compose.yml # Multi-container deployment
└── nginx.conf         # Nginx reverse proxy configuration
```

## 🚀 Quick Start

### Prerequisites

- Go 1.21+
- Node.js 20+
- PostgreSQL 14+ with pgvector extension
- DeepSeek API Key

### 1. Clone the Repository

```bash
git clone https://github.com/xia/nextcrm.git
cd nextcrm-fullstack
```

### 2. Set Up Environment Variables

**Backend (.env)**:
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

**Frontend**:
```bash
cd ../frontend
cp .env.example .env
# Edit .env if needed (default points to localhost:8080)
```

### 3. Start PostgreSQL with pgvector

Using Docker:
```bash
docker run -d \
  --name nextcrm-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nextcrm \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

### 4. Run Database Migrations

```bash
cd backend
psql -U postgres -d nextcrm -f migrations/000001_init_schema.up.sql
```

### 5. Start the Backend

```bash
cd backend
go mod download
go run cmd/server/main.go
```

The backend will start on `http://localhost:8080`

### 6. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

### 🐳 Docker Deployment (Recommended)

```bash
docker-compose up -d
```

This will start:
- PostgreSQL with pgvector on port 5432
- Go backend on port 8080
- React frontend on port 3000
- Nginx reverse proxy on port 80

Access the application at `http://localhost`

## 📚 API Documentation

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Customers

#### List Customers
```http
GET /api/v1/customers?page=1&per_page=10&search=query
Authorization: Bearer <token>
```

#### Create Customer
```http
POST /api/v1/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "company": "Acme Corp",
  "phone": "+1234567890",
  "email": "john@acme.com",
  "industry": "Technology",
  "intent_level": "High",
  "stage": "Leads"
}
```

#### Get Customer Details
```http
GET /api/v1/customers/:id
Authorization: Bearer <token>
```

#### Update Customer
```http
PUT /api/v1/customers/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "company": "Acme Corp",
  "stage": "Qualified",
  "intent_level": "High",
  "contract_value": "100000",
  "probability": 75
}
```

#### Delete Customer
```http
DELETE /api/v1/customers/:id
Authorization: Bearer <token>
```

#### Add Follow-up
```http
POST /api/v1/customers/:id/follow-up
Authorization: Bearer <token>
```

Increments the follow-up count for a customer.

### AI Features

#### Generate Sales Script
```http
POST /api/v1/ai/scripts/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "context": "Selling CRM software",
  "customer_name": "Acme Corp",
  "industry": "Technology",
  "scenario": "cold_call"
}
```

#### Analyze Customer
```http
POST /api/v1/ai/customers/:id/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "analysis_type": "comprehensive"
}
```

### Knowledge Base

#### Vector Search
```http
POST /api/v1/knowledge/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "how to handle price objection",
  "limit": 10
}
```

## 🛠️ Tech Stack

### Frontend
- **React 19**: Modern UI library
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Type-safe JavaScript

### Backend
- **Go 1.21**: High-performance programming language
- **Gin**: Fast HTTP web framework
- **GORM**: ORM library for database operations
- **PostgreSQL**: Relational database
- **pgvector**: Vector similarity search extension
- **JWT**: Secure authentication

### AI
- **Doubao Multimodal** (VolcEngine): Primary AI model for all features
  - Text dialogue (sales scripts, customer analysis)
  - Voice recognition (speech-to-text)
  - Image understanding (business card OCR)
- **DeepSeek API**: Backup AI model (automatic fallback)
- **Vector Embeddings**: Semantic search capability

## 📖 Development Guide

### Backend Development

```bash
cd backend

# Run tests
go test ./...

# Build
go build -o server cmd/server/main.go

# Run
./server
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Database Migrations

Create new migration:
```bash
cd backend/migrations
touch 000002_new_feature.up.sql
touch 000002_new_feature.down.sql
```

Run migration:
```bash
psql -U postgres -d nextcrm -f migrations/000002_new_feature.up.sql
```

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- SQL injection prevention with GORM
- Environment variable configuration

## 🚢 Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### Manual Deployment

1. **Set up PostgreSQL**:
   - Install PostgreSQL 14+
   - Enable pgvector extension
   - Run migrations

2. **Deploy Backend**:
   ```bash
   cd backend
   go build -o server cmd/server/main.go
   ./server
   ```

3. **Deploy Frontend**:
   ```bash
   cd frontend
   npm run build
   # Serve dist/ directory with nginx or similar
   ```

4. **Configure Nginx**:
   - Use provided nginx.conf
   - Adjust paths and upstream servers as needed

## 📝 Environment Variables

### Backend (.env)
```bash
# Server
SERVER_PORT=8080
SERVER_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=nextcrm
DB_SSLMODE=disable

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRY_HOURS=24

# Doubao Multimodal (Primary AI)
DOUBAO_API_KEY=your_doubao_api_key_here
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=doubao-seed-1-8-251228

# DeepSeek AI (Backup)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_EMBEDDING_MODEL=deepseek-embedding
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:8080/api/v1
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- [VolcEngine Doubao](https://www.volcengine.com/product/ark) for multimodal AI capabilities
- [DeepSeek AI](https://deepseek.com/) for backup AI model
- [pgvector](https://github.com/pgvector/pgvector) for vector similarity search
- [Gin](https://gin-gonic.com/) for the web framework
- [React](https://react.dev/) for the frontend framework

## 📞 Support

For support and questions:
- Open an issue on GitHub
- Contact: xia@example.com

## 📚 Additional Documentation

- [**Deployment Guide**](DEPLOYMENT_GUIDE.md) - 🚀 Deploy frontend to Vercel & backend to Tencent Cloud
- [**Speech & OCR Guide**](SPEECH_AND_OCR_GUIDE.md) - 🎤 Voice recognition & 📸 business card OCR using VolcEngine
- [**Priority 1 Enhancements**](PRIORITY_1_ENHANCEMENTS.md) - Customer editing, follow-up tracking, and toast notifications
- [**Project Completion Report**](PROJECT_COMPLETE.md) - Full feature checklist and implementation details
- [**Frontend Integration Summary**](FRONTEND_INTEGRATION_SUMMARY.md) - Frontend API integration details
- [**Implementation Summary**](IMPLEMENTATION_SUMMARY.md) - Detailed implementation guide

---

Built with ❤️ by xia
