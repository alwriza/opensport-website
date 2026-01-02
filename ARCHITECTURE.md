# Future Striker AI - Project Architecture Overview

## 🎯 **Project Overview**
A modern web application for AI-powered soccer player development and training analysis, built with React and Supabase.

## 🏗️ **Architecture Overview**

### **Frontend Architecture (React + TypeScript)**
```
┌─────────────────────────────────────────────────────────────┐
│                    React SPA (Vite)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Pages: Home, PlayerDashboard, CoachDashboard,     │    │
│  │          Training, Register, About                  │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  Components: UI Library (Radix UI + shadcn/ui)     │    │
│  │  - Forms, Charts, Navigation, Cards, etc.          │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  State Management: React Query + Context           │    │
│  │  Routing: React Router                              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### **Backend Architecture (Supabase)**
```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Backend                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Database: PostgreSQL                               │    │
│  │  - player_registrations                              │    │
│  │  - player_analysis                                   │    │
│  │  - training_exercises                                │    │
│  │  - exercise_results                                  │    │
│  │  - ai_recommendations                                │    │
│  │  - weekly_reports                                    │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  Storage: File uploads (videos)                     │    │
│  │  Bucket: player-videos                               │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │  Edge Functions (Deno):                             │    │
│  │  - analyze-player-video                             │    │
│  │  - analyze-exercise                                 │    │
│  │  - generate-recommendations                         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 **Data Pipeline & User Flow**

### **1. Player Registration Flow**
```
User Uploads Video → Supabase Storage → Database (player_registrations)
       ↓
Video URL stored + Player metadata saved
```

### **2. AI Analysis Pipeline**
```
PlayerDashboard "Analyze Video" Button
       ↓
Frontend calls Supabase Edge Function (analyze-player-video)
       ↓
Function fetches player data from DB
       ↓
Sends prompt to Lovable AI API (Gemini model)
       ↓
AI generates scores + recommendations based on player profile
       ↓
Results saved to player_analysis table
       ↓
Frontend displays: Progress bars + Training tips
```

### **3. Training & Exercise Flow**
```
Coach assigns exercises → training_exercises table
       ↓
Player completes exercises → exercise_results table
       ↓
AI analyzes performance → generate-recommendations function
       ↓
Personalized recommendations → ai_recommendations table
       ↓
Weekly progress reports → weekly_reports table
```

## 📁 **Project Structure**

```
/home/hohohouin/future-striker-ai/
├── 📁 src/
│   ├── 📁 components/
│   │   ├── 📁 ui/           # Reusable UI components (shadcn/ui)
│   │   └── radar-chart.tsx  # Custom skill visualization
│   ├── 📁 pages/            # Route components
│   │   ├── Home.tsx
│   │   ├── PlayerDashboard.tsx
│   │   ├── CoachDashboard.tsx
│   │   ├── Training.tsx
│   │   ├── Register.tsx
│   │   └── About.tsx
│   ├── 📁 hooks/            # Custom React hooks
│   ├── 📁 lib/              # Utilities and constants
│   └── 📁 integrations/     # External service integrations
│       └── 📁 supabase/      # Database client + types
├── 📁 supabase/
│   ├── 📁 functions/         # Edge Functions (serverless)
│   │   ├── analyze-player-video/
│   │   ├── analyze-exercise/
│   │   └── generate-recommendations/
│   ├── 📁 migrations/        # Database schema changes
│   └── config.toml          # Supabase project config
├── 📁 public/               # Static assets
└── 📄 package.json          # Dependencies + scripts
```

## 🛠️ **Technology Stack**

### **Frontend**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

### **Backend**
- **Platform**: Supabase (Firebase alternative)
- **Database**: PostgreSQL with Row Level Security
- **Serverless Functions**: Deno runtime (Edge Functions)
- **File Storage**: Supabase Storage
- **AI Integration**: Lovable API → Google Gemini 2.5 Flash

### **Development Tools**
- **Package Manager**: npm/bun
- **Linting**: ESLint
- **Code Quality**: TypeScript strict mode
- **UI Development**: Component tagging (Lovable)

## 🔐 **Security & Data Flow**

### **Authentication**: Supabase Auth (JWT tokens)
### **Authorization**: Row Level Security (RLS) policies
### **API Security**: CORS headers, JWT verification
### **Data Privacy**: All user data stored securely in Supabase

## 🚀 **Deployment Pipeline**

```
Local Development → Git → Supabase Deployment
       ↓
Vite Build → Static files → CDN
       ↓
Edge Functions → Deno runtime
       ↓
Database migrations → PostgreSQL
```

## 🎯 **Key Features**

1. **Player Registration**: Video upload + profile creation
2. **AI Video Analysis**: Automated skill assessment (6 categories)
3. **Training Management**: Exercise assignment + progress tracking
4. **Coach Dashboard**: Player oversight + recommendations
5. **Progress Reports**: Weekly performance summaries
6. **Responsive Design**: Mobile-first UI with dark/light themes

## 🔄 **Current Limitations**

- AI analysis is profile-based (not actual video processing)
- Single-player focus (no team management yet)
- Basic exercise tracking (no real-time feedback)
- Manual video upload (no camera integration)

## 📋 **Database Schema**

### **Core Tables**
- `player_registrations`: Player profiles and video URLs
- `player_analysis`: AI-generated skill scores and recommendations
- `training_exercises`: Assigned exercises with difficulty levels
- `exercise_results`: Performance results and feedback
- `ai_recommendations`: Personalized training suggestions
- `weekly_reports`: Progress summaries and insights

### **Relationships**
```
player_registrations (1) → (many) player_analysis
player_registrations (1) → (many) training_exercises
training_exercises (1) → (many) exercise_results
player_registrations (1) → (many) ai_recommendations
player_registrations (1) → (many) weekly_reports
```

This architecture provides a solid foundation for AI-powered sports training with room for expansion into computer vision, real-time analysis, and team management features.</content>
<parameter name="filePath">/home/hohohouin/future-striker-ai/ARCHITECTURE.md