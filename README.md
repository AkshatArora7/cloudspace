# CloudSpace - S3 File Management SaaS

A production-ready Next.js 15 SaaS application that serves as a lightweight wrapper around AWS S3 for file management, featuring an Apple-inspired minimal design.

## Features

### 🚀 Core Functionality
- **AWS S3 Integration**: Connect your own S3 bucket with secure credential management
- **File Upload**: Drag-and-drop file upload with progress tracking
- **Image Previews**: Automatic thumbnail generation and grid layouts
- **File Organization**: Tabbed interface separating images from other files
- **Shareable Links**: Generate presigned URLs for easy file sharing
- **File Management**: Download, share, and delete files with intuitive controls

### 🔐 Authentication & Security
- JWT-based authentication with email verification
- Encrypted storage of AWS credentials
- Protected API routes
- Secure file access controls

### 🎨 Design
- Apple-inspired minimal aesthetic
- Responsive design for all devices
- Clean typography and consistent spacing
- Smooth animations and hover effects
- Modern gradient backgrounds

### 🛠 Technical Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Database**: Prisma ORM with SQLite
- **Cloud**: AWS SDK v3 for S3 operations
- **Icons**: Lucide React

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- AWS account with S3 bucket

### Installation

1. **Clone the repository**
\`\`\`bash
git clone <repository-url>
cd cloudspace-saas
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
\`\`\`

3. **Set up environment variables**
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and add your configuration:
\`\`\`env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-here"
ENCRYPTION_KEY="your-encryption-key-here"
\`\`\`

4. **Initialize the database**
\`\`\`bash
npm run db:push
npm run db:generate
\`\`\`

5. **Start the development server**
\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to see the application.

## AWS S3 Setup Guide

### Step 1: Create an S3 Bucket
1. Go to the [AWS S3 Console](https://console.aws.amazon.com/s3/)
2. Click "Create bucket"
3. Choose a unique bucket name
4. Select your preferred region
5. Configure settings as needed
6. Click "Create bucket"

### Step 2: Create IAM User
1. Go to the [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Create user"
3. Enter username (e.g., "cloudspace-user")
4. Select "Programmatic access"
5. Click "Next"

### Step 3: Set Permissions
Attach this policy to your user (replace `your-bucket-name` with your actual bucket name):

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
\`\`\`

### Step 4: Get Access Keys
1. Complete the user creation
2. Download the CSV file with credentials
3. Copy the Access Key ID and Secret Access Key
4. Keep these credentials secure

## Project Structure

\`\`\`
cloudspace-saas/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── s3/                   # S3 operations
│   │   └── user/                 # User management
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Main application
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # Reusable components
│   ├── ui/                       # shadcn/ui components
│   ├── FileGrid.tsx              # File display component
│   ├── FileUpload.tsx            # Upload component
│   └── S3ConfigForm.tsx          # S3 setup form
├── prisma/                       # Database schema
├── scripts/                      # Database initialization
└── public/                       # Static assets
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/user/profile` - Get user profile

### S3 Operations
- `POST /api/s3/config` - Save S3 configuration
- `POST /api/s3/test` - Test S3 connection
- `POST /api/s3/upload` - Upload files
- `GET /api/s3/files` - List files
- `GET /api/s3/download` - Download files
- `POST /api/s3/share` - Generate share links
- `DELETE /api/s3/delete` - Delete files

## Database Schema

### Users Table
- `id` - Unique identifier
- `name` - User's full name
- `email` - Email address (unique)
- `password` - Hashed password
- `emailVerified` - Email verification status

### S3Config Table
- `id` - Unique identifier
- `userId` - Foreign key to users
- `accessKeyId` - AWS access key
- `secretAccessKey` - Encrypted AWS secret key
- `region` - AWS region
- `bucketName` - S3 bucket name

## Security Features

### Credential Encryption
AWS credentials are encrypted using AES-256-CBC before storage:

\`\`\`typescript
const encrypt = (text: string) => {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32)
  // ... encryption logic
}
\`\`\`

### JWT Authentication
All API routes are protected with JWT tokens:

\`\`\`typescript
const token = authHeader.substring(7)
const decoded = jwt.verify(token, process.env.JWT_SECRET!)
\`\`\`

### File Access Control
Users can only access files in their own S3 bucket through their stored credentials.

## Deployment

### Environment Variables for Production
\`\`\`env
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
ENCRYPTION_KEY="your-production-encryption-key"
\`\`\`

### Build and Deploy
\`\`\`bash
npm run build
npm start
\`\`\`

## Development

### Database Management
\`\`\`bash
# Push schema changes
npm run db:push

# Open Prisma Studio
npm run db:studio

# Generate Prisma client
npm run db:generate
\`\`\`

### Code Quality
\`\`\`bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using Next.js 15, TypeScript, and AWS S3.
