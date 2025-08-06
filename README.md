<div align="center">
  <img src="public/logo.png" alt="CloudSpace Logo" width="80" height="80">
  
  # CloudSpace
  
  **Professional S3 File Management Platform**
  
  *Transform your AWS S3 bucket into a beautiful, intuitive file management system with enterprise-grade security and Apple-inspired design.*
  
  ![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
  ![AWS S3](https://img.shields.io/badge/AWS-S3-orange?style=flat-square&logo=amazon-aws)
  ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)
  
  [Live Demo](https://cloudspace-demo.vercel.app) • [Documentation](docs/) • [API Reference](docs/api.md)
</div>

---

## Overview

CloudSpace is a production-ready SaaS platform that provides a sophisticated interface for AWS S3 file management. Built with modern web technologies and designed with Apple's design principles in mind, it offers enterprise-level security with consumer-grade usability.

**Key Differentiators:**
- Zero vendor lock-in - uses your existing S3 infrastructure
- Military-grade encryption for credential storage
- Real-time file operations with optimistic UI updates
- Responsive design that works seamlessly across all devices
- Comprehensive API for programmatic access

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │────│   Prisma ORM    │────│   SQLite DB     │
│   (Frontend)    │    │   (Data Layer)  │    │   (Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         └─────────────────┐
                           │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AWS S3 SDK    │────│   Encryption    │────│   JWT Auth      │
│   (File Ops)    │    │   (Security)    │    │   (Identity)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Feature Matrix

| Feature | Status | Description |
|---------|--------|-------------|
| File Upload | ✓ Production | Drag-and-drop with progress tracking |
| Image Previews | ✓ Production | Automatic thumbnail generation |
| File Organization | ✓ Production | Smart categorization and search |
| Secure Sharing | ✓ Production | Presigned URLs with expiration |
| Batch Operations | ✓ Production | Multi-file select and actions |
| Real-time Sync | ✓ Production | Live file updates |
| API Access | ✓ Production | RESTful API with JWT auth |
| Mobile Support | ✓ Production | Responsive design |

## Quick Start Guide

### System Requirements
- Node.js 18.17.0 or higher
- npm 9.0.0 or yarn 3.0.0
- AWS Account with S3 access

### Installation Process

**1. Repository Setup**
```bash
git clone https://github.com/yourusername/cloudspace.git
cd cloudspace
npm install --legacy-peer-deps
```

**2. Environment Configuration**
```bash
cp .env.example .env
```

Configure your environment variables in `.env`:
```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/cloudspace"
# For development with SQLite: DATABASE_URL="file:./dev.db"

# Security Keys (generate strong random strings)
JWT_SECRET="your-256-bit-secret-key-here"
ENCRYPTION_KEY="your-aes-256-encryption-key-here"

# Application Settings
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

**Generate Secure Keys:**
```bash
# Generate JWT_SECRET (256-bit base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate ENCRYPTION_KEY (256-bit base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**3. Database Initialization**
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

**4. Development Server**
```bash
npm run dev
```

Access the application at `http://localhost:3000`

## AWS S3 Configuration

### IAM Policy Template
Create a custom IAM policy with minimal required permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudSpaceFileOperations",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject", 
        "s3:DeleteObject",
        "s3:GetObjectVersion"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    },
    {
      "Sid": "CloudSpaceBucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME"
    }
  ]
}
```

### CORS Configuration
Add this CORS policy to your S3 bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

## Project Structure

```
cloudspace/
├── app/                    # Next.js 15 App Directory
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Main application
│   ├── api/               # API endpoints
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui primitives
│   ├── FileGrid.tsx      # File display logic
│   ├── FileUpload.tsx    # Upload functionality
│   └── Spinner.tsx       # Loading states
├── lib/                   # Utility functions
│   ├── utils.ts          # Helper functions
│   ├── auth.ts           # Authentication logic
│   └── s3.ts             # AWS S3 operations
├── prisma/               # Database schema
│   ├── schema.prisma     # Data models
│   └── migrations/       # Database migrations
├── public/               # Static assets
├── types/                # TypeScript definitions
└── docs/                 # Documentation
```

## API Reference

### Authentication Endpoints
```
POST   /api/auth/signup          Create new user account
POST   /api/auth/signin          User authentication
GET    /api/user/profile         Get user information
```

### File Management Endpoints
```
POST   /api/s3/config           Save S3 credentials
GET    /api/s3/files            List bucket contents
POST   /api/s3/upload           Upload files
GET    /api/s3/download         Download files
POST   /api/s3/share            Generate share links
DELETE /api/s3/delete           Delete files
```

### Response Format
All API responses follow this structure:
```typescript
{
  success: boolean
  data?: any
  error?: string
  timestamp: string
}
```

## Security Implementation

### Encryption at Rest
All sensitive data is encrypted using AES-256-CBC:
```typescript
const encrypt = (text: string): string => {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32)
  const iv = crypto.randomBytes(16)
  // Implementation details...
}
```

### JWT Token Management
Tokens include security measures:
- 24-hour expiration
- Secure HTTP-only cookies
- CSRF protection
- Rate limiting

### Input Validation
All inputs are validated using Zod schemas:
```typescript
const uploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive().max(100 * 1024 * 1024), // 100MB limit
  contentType: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^]*$/)
})
```

## Performance Optimizations

### Frontend Optimizations
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Optimistic UI updates
- Service worker for offline support

### Backend Optimizations
- Database query optimization with Prisma
- Response caching strategies
- Connection pooling
- Compression middleware

### S3 Optimizations
- Presigned URLs for direct uploads
- Multipart uploads for large files
- CloudFront integration ready
- Intelligent tiering support

## Development Workflow

### Code Quality Standards
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test

# Build verification
npm run build
```

### Database Management
```bash
# Generate Prisma client
npm run db:generate

# Create migration
npm run db:migrate

# Reset database
npm run db:reset

# Open Prisma Studio
npm run db:studio
```

## Deployment Guide

### Production Environment Variables
```env
DATABASE_URL="postgresql://user:pass@host:port/db"
JWT_SECRET="production-secret-key"
ENCRYPTION_KEY="production-encryption-key"
NEXTAUTH_URL="https://yourdomain.com"
NODE_ENV="production"
```

### Deployment Platforms

**Vercel (Recommended)**
```bash
npm install -g vercel
vercel --prod
```

**Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Monitoring and Analytics

### Health Checks
- `/api/health` - Application status
- `/api/health/db` - Database connectivity
- `/api/health/s3` - AWS S3 connectivity

### Performance Metrics
- API response times
- Database query performance
- S3 operation latency
- User engagement analytics

## Contributing Guidelines

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the coding standards
4. Write comprehensive tests
5. Submit a pull request

### Code Standards
- TypeScript strict mode
- ESLint configuration compliance
- Prettier formatting
- Conventional commit messages

### Testing Requirements
- Unit tests for utilities
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 80% code coverage

## License and Support

**License:** MIT License - see [LICENSE](LICENSE) file for details

**Support Channels:**
- GitHub Issues for bug reports
- GitHub Discussions for feature requests
- Documentation at `/docs`
- API reference at `/docs/api.md`

**Enterprise Support:** Contact us for enterprise licensing and dedicated support options.

---

**Built with precision engineering and attention to detail.**

*CloudSpace represents the next generation of file management platforms, combining the power of AWS infrastructure with the elegance of modern web design.*
