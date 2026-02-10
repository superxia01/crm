# nextCRM Fullstack - Quick Start Guide

This guide will help you get nextCRM up and running in minutes.

## 🚀 Option 1: Docker (Recommended)

The fastest way to get started is using Docker Compose.

### Prerequisites
- Docker installed on your machine
- DeepSeek API Key (get one at https://console.volcengine.com/ark)

### Steps

1. **Clone and navigate to the project**
```bash
cd /Users/xia/Documents/GitHub/nextcrm-fullstack
```

2. **Create environment file**
```bash
cp .env.example .env.local
```

3. **Edit `.env.local` and add your DeepSeek API Key**
```bash
DEEPSEEK_API_KEY=your_actual_api_key_here
```

4. **Start all services**
```bash
docker-compose up -d
```

This will start:
- PostgreSQL with pgvector on port 5432
- Go backend on port 8080
- React frontend on port 3000
- Nginx reverse proxy on port 80

5. **Access the application**
Open your browser and go to: `http://localhost`

The application should be running!

## 🛠️ Option 2: Manual Setup

### Prerequisites
- Go 1.21+
- Node.js 20+
- PostgreSQL 14+ with pgvector extension

### Step 1: Start PostgreSQL

**Using Docker:**
```bash
docker run -d \
  --name nextcrm-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nextcrm \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

**Or install PostgreSQL locally:**
```bash
# macOS
brew install postgresql@14
brew install pgvector

# Ubuntu/Debian
sudo apt-get install postgresql-14-postgresql-14-pgvector
```

### Step 2: Setup Backend

```bash
cd backend

# Create .env file
cp .env.example .env

# Edit .env and add your credentials:
# - DB_PASSWORD
# - JWT_SECRET
# - DEEPSEEK_API_KEY

# Install dependencies
go mod download

# Run database migrations
psql -U postgres -d nextcrm -f migrations/000001_init_schema.up.sql

# Start the server
go run cmd/server/main.go
```

The backend will start on `http://localhost:8080`

### Step 3: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start dev server
npm run dev
```

The frontend will start on `http://localhost:3000`

## 🔑 Default Users

After running migrations, you can seed the database with demo users:

```bash
cd backend
go run scripts/seed.go
```

This creates:
- **Admin**: admin@nextcrm.com / admin123
- **Demo User**: demo@nextcrm.com / demo123

## ✅ Verify Installation

### 1. Check Backend Health
```bash
curl http://localhost:8080/health
```

Should return: `{"status":"ok"}`

### 2. Register a New User
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📚 Next Steps

1. **Explore the Features**
   - Go to Customer Management to add customers
   - Try the AI Script Assistant to generate sales scripts
   - Build your Knowledge Base with sales materials

2. **Customize the Application**
   - Edit the frontend code in `frontend/`
   - Modify the backend API in `backend/`
   - Add new features as needed

3. **Deploy to Production**
   - See DEPLOYMENT.md for detailed deployment instructions
   - Update environment variables for production
   - Configure Nginx for your domain

## 🐛 Troubleshooting

### Backend won't start
- Check if PostgreSQL is running: `psql -U postgres -d nextcrm`
- Verify database migrations were applied
- Check .env file for correct credentials

### Frontend can't connect to backend
- Verify backend is running on port 8080
- Check VITE_API_URL in frontend/.env
- Check CORS settings in backend middleware

### AI features not working
- Verify DEEPSEEK_API_KEY is set correctly
- Check if API key has credits available
- Review backend logs for API errors

### Database connection errors
- Ensure PostgreSQL is running
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in backend/.env
- Verify pgvector extension is installed

## 📖 Documentation

- **Full README**: See [README.md](README.md) for detailed documentation
- **API Documentation**: All endpoints are documented in the main README
- **Backend README**: See [backend/README.md](backend/README.md) for backend-specific info

## 🎯 Key Features Implemented

✅ User authentication (JWT)
✅ Customer management (CRUD + search + pagination)
✅ AI-powered sales script generation
✅ Customer analysis with AI
✅ Knowledge base with vector search
✅ Responsive React UI
✅ RESTful API design
✅ PostgreSQL + pgvector integration

## 💡 Tips

1. **Development Mode**: Use `npm run dev` for frontend hot-reloading
2. **Database Changes**: Create new migration files for schema changes
3. **API Testing**: Use tools like Postman or Insomnia to test API endpoints
4. **Logs**: Check backend console for detailed logs
5. **Security**: Change JWT_SECRET and DB_PASSWORD in production

## 🆘 Need Help?

- Check the main [README.md](README.md)
- Review backend [README.md](backend/README.md)
- Open an issue on GitHub
- Contact: xia@example.com

---

Happy coding! 🚀
