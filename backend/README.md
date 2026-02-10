# nextCRM Backend

Go backend for nextCRM fullstack application.

## Tech Stack

- Go 1.21
- Gin Web Framework
- GORM ORM
- PostgreSQL with pgvector extension
- JWT Authentication
- DeepSeek AI API

## Project Structure

```
backend/
├── cmd/
│   └── server/
│       └── main.go                 # Application entry point
├── internal/
│   ├── api/
│   │   ├── handler/                # HTTP handlers
│   │   ├── middleware/             # Middleware (auth, cors, logger)
│   │   └── router.go               # Router configuration
│   ├── models/                     # Data models
│   ├── repository/                 # Data access layer
│   ├── service/                    # Business logic layer
│   ├── config/                     # Configuration
│   └── dto/                        # Data transfer objects
├── pkg/                            # Public packages
│   ├── database/
│   ├── jwt/
│   ├── deepseek/
│   └── utils/
├── migrations/                     # Database migrations
├── scripts/                        # Utility scripts
└── configs/                        # Configuration files
```

## Getting Started

### Prerequisites

- Go 1.21+
- PostgreSQL 14+ with pgvector extension
- DeepSeek API Key

### Installation

1. Clone the repository
```bash
git clone https://github.com/xia/nextcrm.git
cd nextcrm-fullstack/backend
```

2. Install dependencies
```bash
go mod download
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations
```bash
psql -U postgres -d nextcrm -f migrations/000001_init_schema.up.sql
```

5. Run the application
```bash
go run cmd/server/main.go
```

The server will start on port 8080.

### Docker Deployment

```bash
docker-compose up -d
```

## API Documentation

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication

#### Register
```
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123"
}
```

#### Login
```
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Customers

#### List Customers
```
GET /api/v1/customers?page=1&per_page=10&search=query
Authorization: Bearer <token>
```

#### Create Customer
```
POST /api/v1/customers
Authorization: Bearer <token>
{
  "name": "John Doe",
  "company": "Acme Corp",
  "phone": "+1234567890",
  "email": "john@acme.com",
  ...
}
```

#### Update Customer
```
PUT /api/v1/customers/:id
Authorization: Bearer <token>
{
  "name": "Jane Doe",
  ...
}
```

#### Delete Customer
```
DELETE /api/v1/customers/:id
Authorization: Bearer <token>
```

### Knowledge Base

#### List Knowledge
```
GET /api/v1/knowledge?page=1&per_page=10
Authorization: Bearer <token>
```

#### Create Knowledge
```
POST /api/v1/knowledge
Authorization: Bearer <token>
{
  "title": "Sales Script",
  "content": "...",
  "type": "sales_script",
  "tags": ["sales", "cold-call"]
}
```

#### Vector Search
```
POST /api/v1/knowledge/search
Authorization: Bearer <token>
{
  "query": "how to handle price objection",
  "limit": 10
}
```

### AI Features

#### Generate Sales Script
```
POST /api/v1/ai/scripts/generate
Authorization: Bearer <token>
{
  "context": "Selling CRM software",
  "customer_name": "Acme Corp",
  "industry": "Technology",
  "scenario": "cold_call"
}
```

#### Analyze Customer
```
POST /api/v1/ai/customers/:id/analyze
Authorization: Bearer <token>
{
  "analysis_type": "comprehensive"
}
```

## Development

### Running Tests
```bash
go test ./...
```

### Building for Production
```bash
go build -o server cmd/server/main.go
```

### Database Migrations

Create new migration:
```bash
# Create up migration
touch migrations/000002_new_feature.up.sql

# Create down migration
touch migrations/000002_new_feature.down.sql
```

Run migration:
```bash
psql -U postgres -d nextcrm -f migrations/000002_new_feature.up.sql
```

## Configuration

Configuration is loaded from environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| SERVER_PORT | Server port | 8080 |
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 5432 |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | - |
| DB_NAME | Database name | nextcrm |
| JWT_SECRET | JWT secret key | - |
| DEEPSEEK_API_KEY | DeepSeek API key | - |

## License

MIT
