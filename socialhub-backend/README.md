# SocialHub Backend

A modern social network platform backend built with Spring Boot 3.5.x, Java 17, and MongoDB.

## 🚀 Quick Start

### Prerequisites

- **Java 17 LTS** ([Download](https://www.oracle.com/java/technologies/downloads/))
- **MongoDB Community Server** ([Download](https://www.mongodb.com/try/download/community))
- **Maven** (optional - project includes Maven Wrapper)
- **Git** for version control

### Installation & Setup

#### 1. Clone Repository

```bash
git clone <repository-url>
cd socialhub-backend
```

#### 2. Install MongoDB (Windows)

**Option A: Using Chocolatey (Recommended)**
```bash
choco install mongodb-community
```

**Option B: Manual Installation**
1. Download MongoDB Community from: https://www.mongodb.com/try/download/community
2. Run the installer (.msi file)
3. Select "Install as a Service" during installation
4. MongoDB will start automatically

**Verify Installation:**
```bash
mongo --version
# or
mongod --version
```

**Start MongoDB Service (if not running):**
```bash
# Windows Services
services.msc  # Find MongoDB and start it

# Or via Command Prompt (Admin)
net start MongoDB
```

#### 3. Configure MongoDB Connection

**Create `.env` file in project root:**
```bash
cp .env.example .env
```

**Edit `.env` to match your MongoDB setup** (default is already correct for local setup):
```env
MONGODB_URI=mongodb://localhost:27017/socialhub
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=local
```

#### 4. Verify MongoDB is Running

```bash
# Open another terminal and connect to MongoDB
mongosh

# or if using older MongoDB driver
mongo
```

#### 5. Build Project

Using Maven Wrapper (no need to install Maven):

```bash
# Windows
mvnw.cmd clean build

# macOS/Linux
./mvnw clean build
```

Or if Maven is installed:
```bash
mvn clean install
```

#### 6. Run Application

```bash
# Windows
mvnw.cmd spring-boot:run

# macOS/Linux
./mvnw spring-boot:run
```

Or import into IDE and run `SocialHubApplication.java`

**Expected Output:**
```
SocialHub Backend Started Successfully
Server: http://localhost:8080
Swagger UI: http://localhost:8080/swagger-ui.html
```

---

## 📊 Project Structure

```
socialhub-backend/
├── src/main/java/com/socialhub/
│   ├── SocialHubApplication.java              # Main entry point
│   ├── config/
│   │   └── SecurityConfig.java                # Spring Security & CORS
│   ├── common/
│   │   ├── exception/                         # Custom exceptions
│   │   │   ├── ApiException.java
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   ├── ResourceNotFoundException.java
│   │   │   └── ValidationException.java
│   │   └── response/                          # Standard response wrappers
│   │       ├── ApiResponse.java
│   │       └── ErrorResponse.java
│   ├── health/
│   │   └── controller/
│   │       └── HealthController.java          # Health check endpoints
│   └── user/
│       ├── controller/
│       │   └── UserController.java            # User API endpoints
│       ├── service/
│       │   └── UserService.java               # Business logic
│       ├── repository/
│       │   └── UserRepository.java            # Data access
│       ├── document/
│       │   └── User.java                      # MongoDB document
│       └── dto/
│           ├── UserDto.java
│           └── CreateUserDto.java
├── src/main/resources/
│   ├── application.yml                        # Default config
│   └── application-local.yml                  # Local development config
├── src/test/java/com/socialhub/
│   ├── HealthControllerTest.java
│   └── UserServiceTest.java
├── pom.xml                                    # Maven dependencies
├── .env.example                               # Environment variables template
├── .gitignore
├── mvnw / mvnw.cmd                           # Maven Wrapper
└── README.md
```

---

## 🔌 API Endpoints

### Base URL: `http://localhost:8080/api`

### Health Check
- **GET** `/health` - Application health status
- **GET** `/health/detailed` - Detailed health information
- **GET** `/health/db` - Database connectivity check

### User Management
- **GET** `/user/{id}` - Get user by ID
- **GET** `/user/username/{username}` - Get user by username
- **GET** `/user/email/{email}` - Get user by email
- **POST** `/user` - Create new user (registration)

### Documentation
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **API Docs (JSON)**: http://localhost:8080/api-docs
- **Actuator Health**: http://localhost:8080/actuator/health

---

## 🔐 Security Configuration

### Public Endpoints (No Authentication Required)
- `/api/health/**` - Health checks
- `/swagger-ui/**` - Swagger documentation
- `/api-docs/**` - OpenAPI documentation
- `/api/auth/register` - User registration (prepared for implementation)
- `/api/auth/login` - User login (prepared for implementation)

### Protected Endpoints (Requires Authentication)
- All user API endpoints (prepared for JWT authentication)
- All post API endpoints (prepared for implementation)
- All social features (prepared for implementation)

### CORS Configuration
**Allowed Origins:**
- `http://localhost:5173` (Vite development)
- `http://localhost:3000` (React development)

**Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS

**Allowed Headers:** Content-Type, Authorization, X-Requested-With

---

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and modify as needed:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/socialhub

# Server
SERVER_PORT=8080

# Profile (local, dev, prod)
SPRING_PROFILES_ACTIVE=local

# Logging
LOGGING_LEVEL_COM_SOCIALHUB=DEBUG
```

### Using application-local.yml

For team members with different MongoDB settings:

1. Create `src/main/resources/application-local.yml`
2. Add your local configuration
3. Run with: `mvn spring-boot:run -Dspring.profiles.active=local`

---

## 🧪 Testing

### Run All Tests
```bash
mvnw.cmd test
# or
./mvnw test
```

### Run Specific Test
```bash
mvnw.cmd test -Dtest=HealthControllerTest
```

### Run Tests with Coverage
```bash
mvnw.cmd clean test jacoco:report
```

### Integration Tests
Tests automatically connect to local MongoDB. Ensure MongoDB is running before executing tests.

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
1. Ensure MongoDB is installed
2. Start MongoDB service: `net start MongoDB` (Windows)
3. Verify connection: `mongosh` or `mongo`
4. Check MongoDB URI in `.env` file

### Port Already in Use
```
Error: Port 8080 already in use
```
**Solution:**
1. Find process using port 8080:
   ```bash
   # Windows
   netstat -ano | findstr :8080
   ```
2. Kill process:
   ```bash
   # Windows
   taskkill /PID <PID> /F
   ```
3. Or change port in `.env`: `SERVER_PORT=8081`

### Maven Build Fails
```
Error: java: error: release version 17 not supported
```
**Solution:**
1. Install Java 17 LTS
2. Set JAVA_HOME: `set JAVA_HOME=C:\Program Files\Java\jdk-17`
3. Verify: `java -version`
4. Clean and rebuild: `mvnw.cmd clean install`

### Permission Denied (macOS/Linux)
```bash
chmod +x mvnw
./mvnw clean install
```

---

## 👥 Team Development Workflow

### 1. Initial Setup (First Time)
```bash
# Clone repository
git clone <repo-url>
cd socialhub-backend

# Setup Java 17 and MongoDB (see Prerequisites)

# Create .env file
cp .env.example .env

# Build project
mvnw.cmd clean install

# Run tests
mvnw.cmd test

# Start application
mvnw.cmd spring-boot:run
```

### 2. Daily Development
```bash
# Update from main branch
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Build and test
mvnw.cmd clean install

# Make your changes...

# Run tests before commit
mvnw.cmd test

# Commit with descriptive message
git add .
git commit -m "feat: Add new feature description"

# Push branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

### 3. Branching Strategy
- `main` - Production code, stable releases
- `develop` - Development branch, integration point
- `feature/name` - Feature development branches
- `bugfix/name` - Bug fix branches
- `hotfix/name` - Production hotfixes

### 4. Commit Message Convention
```
feat: Add new feature
fix: Fix bug in module
docs: Update documentation
refactor: Refactor code
test: Add or update tests
chore: Update dependencies or configuration
```

---

## 🚀 Deployment (Future)

### Production Checklist
- [ ] MongoDB production instance ready
- [ ] Environment variables configured for production
- [ ] Spring Security JWT tokens implemented
- [ ] Database backups enabled
- [ ] Logging aggregation configured
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting implemented
- [ ] API documentation reviewed

### Build for Production
```bash
mvnw.cmd clean package -Dspring.profiles.active=prod

# Generate executable JAR
java -jar target/socialhub-backend-1.0.0.jar
```

---

## 📚 Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Java | 17 LTS | Programming language |
| Spring Boot | 3.5.1 | Web framework |
| Spring Security | 6.x | Authentication & Authorization |
| Spring Data MongoDB | - | Database access |
| MongoDB | Latest | Database |
| Springdoc OpenAPI | 2.5.0 | Swagger UI / API Documentation |
| Lombok | - | Code generation (reduce boilerplate) |
| JUnit 5 | - | Testing framework |
| Mockito | - | Mocking for tests |
| BCrypt | - | Password encryption |
| JWT | 0.12.3 | Token-based authentication (future) |

---

## 📋 Future Implementation Tasks

- [ ] Authentication (JWT implementation)
- [ ] Post management (CRUD operations)
- [ ] Social features (Like, Comment, Share)
- [ ] Follow system
- [ ] Notification system
- [ ] Direct messaging with WebSocket
- [ ] Search functionality
- [ ] File upload (avatars, covers, post media)
- [ ] Analytics and monitoring
- [ ] Performance optimization

---

## 📞 Support & Questions

For questions or issues:
1. Check this README and troubleshooting section
2. Review Spring Boot documentation: https://spring.io/projects/spring-boot
3. MongoDB documentation: https://docs.mongodb.com/
4. Check existing GitHub issues
5. Contact team lead or create a new issue

---

## 📝 License

This project is part of SocialHub platform - All rights reserved.

---

## ✅ Checklist Before First Push

- [ ] Java 17 installed and set in JAVA_HOME
- [ ] MongoDB installed and running
- [ ] `.env` file created with correct MongoDB URI
- [ ] `mvnw.cmd clean install` runs successfully
- [ ] `mvnw.cmd test` passes all tests
- [ ] `mvnw.cmd spring-boot:run` starts without errors
- [ ] Health endpoint responds: `http://localhost:8080/api/health`
- [ ] Swagger UI accessible: `http://localhost:8080/swagger-ui.html`
- [ ] `.gitignore` configured (don't commit `.env` or sensitive files)
- [ ] `.env.example` created and updated for team

---

**Happy coding! 🎉**

Last Updated: January 2025
