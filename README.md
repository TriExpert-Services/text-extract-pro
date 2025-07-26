# 🚀 TextExtract Pro - Advanced Text Extraction Application

> **Intelligent document processing powered by AI - Extract text from images and documents with unmatched precision**

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://docker.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?style=flat&logo=typescript)](https://typescriptjs.org)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
- [Environment Setup](#environment-setup)
- [Usage Guide](#usage-guide)
- [API Integration](#api-integration)
- [Contributing](#contributing)

## 🌟 Overview

**TextExtract Pro** is a cutting-edge web application that leverages advanced AI technology to extract text from documents and images with exceptional accuracy. Built with modern web technologies and designed for both individual users and enterprise integration.

### Key Capabilities
- **🔍 High-Fidelity OCR**: Extract text from images with 95%+ accuracy
- **📄 Multi-Format Support**: Handle PDF, DOC, DOCX, TXT, PNG, JPG, GIF, BMP, TIFF
- **🤖 AI Enhancement**: Improve extracted text quality using OpenAI GPT models
- **📊 Advanced Analytics**: Comprehensive usage statistics and performance metrics
- **🔐 Enterprise Security**: Row-level security with Supabase authentication
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices

## ✨ Features

### 🚀 Core Functionality
- **Drag & Drop Interface**: Intuitive file upload with real-time preview
- **Batch Processing**: Handle multiple files simultaneously
- **Live Text Editing**: Edit and enhance extracted text in real-time
- **Export Options**: Download results in multiple formats
- **Processing History**: Complete audit trail of all extractions

### 📊 Analytics Dashboard
- **Usage Metrics**: Track extractions, confidence scores, and processing times
- **Visual Charts**: Interactive graphs showing daily activity and file type distribution
- **Performance Insights**: Analyze accuracy trends and optimization opportunities
- **User Statistics**: Personal and team-level usage analytics

### 🔧 Advanced Features
- **Dark/Light Mode**: Seamless theme switching with user preference memory
- **Real-time Collaboration**: Share and collaborate on extracted documents
- **API Integration**: RESTful API for third-party integrations
- **Confidence Scoring**: AI-powered accuracy assessment for each extraction

## 🛠 Tech Stack

### Frontend
- **React 18.3+** - Modern UI framework with hooks and concurrent features
- **TypeScript 5.5+** - Type-safe development with advanced inference
- **Tailwind CSS 3.4+** - Utility-first styling with custom design system
- **Vite 5.4+** - Lightning-fast development and optimized builds

### Backend Services
- **Supabase** - PostgreSQL database with real-time subscriptions
- **OpenAI GPT-4 Vision** - Advanced text extraction and enhancement
- **Supabase Storage** - Secure file storage with access controls
- **Supabase Auth** - Enterprise-grade authentication and authorization

### DevOps & Deployment
- **Docker & Docker Compose** - Containerized deployment with orchestration
- **Nginx** - High-performance web server with compression and caching
- **Multi-stage Builds** - Optimized production images
- **Health Monitoring** - Automated health checks and recovery

### Development Tools
- **ESLint** - Code quality and consistency enforcement
- **Prettier** - Automated code formatting
- **Recharts** - Interactive data visualization
- **React Hot Toast** - Beautiful notification system

## ⚡ Quick Start

### Prerequisites
- **Node.js 18+** and **npm**
- **Docker** and **Docker Compose**
- **Supabase Account** with project setup
- **OpenAI API Key** (optional but recommended)

### Local Development
```bash
# 1. Clone the repository
git clone https://github.com/yourusername/textextract-pro.git
cd textextract-pro

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials

# 4. Start development server
npm run dev

# 5. Open browser
open http://localhost:5173
```

## 🐳 Docker Deployment

### Quick Deploy
```bash
# 1. Make scripts executable
chmod +x scripts/*.sh

# 2. Deploy with one command
./scripts/deploy.sh

# 3. Access application
open http://localhost:8081
```

### Production Deployment
```bash
# Deploy with monitoring and load balancing
./scripts/deploy.sh prod

# Run health checks
./scripts/health-check.sh
```

### Docker Services
- **Main App** (Port 8080): React application with Nginx
- **Redis** (Port 6379): Caching layer for enhanced performance
- **Health Monitoring**: Automated container health checks
- **Log Management**: Centralized logging with rotation

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 🔧 Environment Setup

### Required Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (Optional)
VITE_OPENAI_API_KEY=sk-your-openai-api-key
```

### Supabase Setup
1. **Create Project**: Sign up at [supabase.com](https://supabase.com)
2. **Run Migrations**: The app includes automatic database setup
3. **Configure RLS**: Row Level Security policies are pre-configured
4. **Storage Setup**: File storage buckets are created automatically

### Database Schema
The application automatically creates:
- **extractions** table: Stores all text extraction records
- **user_analytics** table: Tracks usage metrics and statistics
- **Storage buckets**: Secure file storage with user-based access

## 📖 Usage Guide

### Basic Workflow
1. **Sign Up/Login**: Create account or sign in with existing credentials
2. **Configure API Key**: Add OpenAI API key in Settings (optional)
3. **Upload Files**: Drag & drop or click to select documents/images
4. **Extract Text**: AI processes files and returns extracted text
5. **Review & Edit**: Edit extracted text and enhance with AI
6. **Export Results**: Download as TXT or copy to clipboard

### Supported File Types
- **Images**: PNG, JPG, JPEG, GIF, BMP, TIFF
- **Documents**: PDF, DOC, DOCX, TXT
- **Size Limit**: 10MB per file
- **Batch Limit**: Up to 10 files simultaneously

### Advanced Features
- **Text Enhancement**: Use AI to improve OCR accuracy and formatting
- **Confidence Scoring**: Each extraction includes an accuracy assessment
- **Search History**: Find previous extractions with full-text search
- **Analytics Dashboard**: Track usage patterns and performance metrics

## 🔌 API Integration

### Authentication
```javascript
// Initialize Supabase client
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key)

// Sign in user
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### Text Extraction
```javascript
// Extract text from image
const openai = new OpenAIService(apiKey)
const result = await openai.extractTextFromImage(base64Image)

// Save to database
const { data, error } = await supabase
  .from('extractions')
  .insert({
    user_id: user.id,
    file_name: 'document.pdf',
    extracted_text: result.text,
    confidence_score: result.confidence
  })
```

### Analytics Query
```javascript
// Get user analytics
const { data: analytics } = await supabase
  .from('user_analytics')
  .select('*')
  .eq('user_id', user.id)
  .single()
```

## 🏗 Architecture

### Component Structure
```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── Extract/        # Text extraction interface
│   └── Layout/         # Navigation and layout
├── contexts/           # React context providers
├── lib/               # Utility libraries and services
├── pages/             # Main application pages
└── types/             # TypeScript type definitions
```

### Data Flow
1. **User uploads file** → FileUpload component
2. **File processed** → OpenAI API or local parser
3. **Results saved** → Supabase database
4. **Analytics updated** → Automatic triggers
5. **UI updated** → Real-time subscriptions

## 🚦 Performance

### Optimization Features
- **Code Splitting**: Automatic route-based chunking
- **Image Optimization**: Compressed assets with lazy loading
- **Caching Strategy**: Aggressive caching with cache busting
- **Bundle Analysis**: Optimized vendor chunks

### Monitoring
- **Health Checks**: Automated endpoint monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time and throughput tracking
- **Resource Usage**: Memory and CPU monitoring

## 🔒 Security

### Authentication & Authorization
- **Secure Authentication**: Supabase Auth with JWT tokens
- **Row Level Security**: Database-level access controls
- **API Key Management**: Secure storage and rotation
- **CORS Protection**: Configured for production security

### Data Protection
- **Encrypted Storage**: All data encrypted at rest
- **Secure Transport**: HTTPS/TLS for all communications
- **File Validation**: Comprehensive input sanitization
- **Rate Limiting**: API abuse prevention

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Process
1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes with tests
4. **Submit** a pull request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Consistent code style enforcement
- **Testing**: Unit tests for critical functionality
- **Documentation**: Comprehensive inline documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Full documentation](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/textextract-pro/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/textextract-pro/discussions)
- **Email**: support@textextract-pro.com

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 Vision API
- **Supabase** for backend infrastructure
- **React Team** for the amazing framework
- **Contributors** who help improve this project

---

<div align="center">
  <strong>Built with ❤️ for the developer community</strong>
  <br>
  <sub>TextExtract Pro - Making document processing intelligent and accessible</sub>
</div>