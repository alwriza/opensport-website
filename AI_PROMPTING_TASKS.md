# OpenSport Platform - AI Prompting Task List

## PROJECT CONTEXT
Platform for AI-powered football kick analysis. User uploads video → ML models analyze technique → Display 5 scores (stability, power, technique, balance, overall) + feedback.

**Tech Stack:**
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Auth: Clerk
- Database: Supabase (PostgreSQL)
- Storage: Supabase Storage
- ML API: FastAPI (already built, localhost:8000)
- Deployment: Vercel (frontend), ngrok/Render (ML worker)

---

## PHASE 1: AUTHENTICATION

### Task: Setup Clerk Authentication
```
Install @clerk/nextjs package
Add Clerk provider to app/layout.tsx
Create middleware.ts for route protection
Create app/sign-in/[[...sign-in]]/page.tsx
Create app/sign-up/[[...sign-up]]/page.tsx
Add Clerk environment variables to .env.local
Style auth pages with Tailwind CSS
```

---

## PHASE 2: DATABASE SETUP

### Task: Create Supabase Database Schema
```sql
-- Users table (synced from Clerk)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'player',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  duration FLOAT,
  file_size_mb FLOAT,
  status TEXT DEFAULT 'processing',
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Analyses table (ML results)
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  stability FLOAT NOT NULL,
  power FLOAT NOT NULL,
  technique FLOAT NOT NULL,
  balance FLOAT NOT NULL,
  overall FLOAT NOT NULL,
  feedback TEXT NOT NULL,
  tags JSONB,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_video_id ON analyses(video_id);
```

### Task: Configure Supabase Storage
```
Create "videos" bucket in Supabase Storage
Set bucket to private (authenticated users only)
Set max file size to 100MB
Allow file types: .mp4, .mov, .avi, .mkv
```

### Task: Enable Row Level Security
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users see own videos" ON videos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users see own analyses" ON analyses
  FOR SELECT USING (auth.uid() = user_id);
```

---

## PHASE 3: CLERK-SUPABASE SYNC

### Task: Create Clerk Webhook
```typescript
// app/api/webhooks/clerk/route.ts
// Handle user.created event → Insert into Supabase users table
// Handle user.updated event → Update Supabase users table
// Handle user.deleted event → Delete from Supabase users table

POST endpoint that:
1. Verifies Clerk webhook signature (Svix)
2. Parses webhook payload
3. Extracts user data (clerk_id, email, name)
4. Inserts/updates/deletes in Supabase users table
5. Returns 200 OK
```

---

## PHASE 4: VIDEO UPLOAD

### Task: Create Upload Page UI
```typescript
// app/dashboard/upload/page.tsx

Components needed:
- Drag-and-drop zone for video files
- File preview after selection (thumbnail, name, size, duration)
- Client-side validation (format, size, duration 3-15s)
- Upload progress bar
- "Upload" button (disabled until valid file selected)
- Error messages for invalid files
- Success notification after upload

Styling: Modern, clean UI with Tailwind CSS
```

### Task: Implement Upload Logic
```typescript
// Upload flow:
1. User selects video file
2. Validate file (format, size, duration)
3. Generate unique filename (UUID + extension)
4. Upload to Supabase Storage 'videos' bucket
5. Get storage path from Supabase
6. Insert record in 'videos' table with status='processing'
7. Get video_id from insert
8. Call processVideo() function with video_id
9. Redirect to results page with loading state
```

---

## PHASE 5: ML PROCESSING

### Task: Create Supabase Edge Function
```typescript
// supabase/functions/process-video/index.ts

Function that:
1. Receives video_id as parameter
2. Fetches video record from 'videos' table
3. Generates signed URL for video file (expires in 1 hour)
4. Calls ML Worker API: POST {ML_WORKER_URL}/analyze
   Body: { "video_url": signedUrl }
5. Waits for ML response (30-60 seconds)
6. Parses response JSON: { scores, feedback, tags, processing_time_ms }
7. Inserts into 'analyses' table
8. Updates 'videos' status to 'completed'
9. Returns analysis result

Error handling:
- If ML worker fails, set video status to 'failed'
- Return error message to client
```

### Task: Deploy ML Worker
```bash
# Option A: ngrok (for demo/testing)
python src/inference/fastapi_app.py  # Start ML API on localhost:8000
ngrok http 8000                      # Get public URL
# Save URL as environment variable ML_WORKER_URL

# Option B: Render.com (production)
# Create Web Service on Render
# Connect GitHub repo
# Set build: pip install -r requirements.txt
# Set start: uvicorn src.inference.fastapi_app:app --host 0.0.0.0 --port $PORT
# Get deployment URL
```

### Task: Frontend Polling for Results
```typescript
// After upload, poll for completion:
1. Call Edge Function with video_id
2. Show "Processing..." with animated spinner
3. Poll database every 5 seconds: SELECT status FROM videos WHERE id = video_id
4. When status = 'completed', redirect to results page
5. When status = 'failed', show error message
```

---

## PHASE 6: RESULTS PAGE

### Task: Create Results Page Layout
```typescript
// app/dashboard/results/[id]/page.tsx

Layout:
- Top: Video player (HTML5 video element)
- Middle: 5 score gauges in a row (Stability, Power, Technique, Balance, Overall)
- Bottom: Feedback text + tags as badges

Fetch data:
1. Get analysis from 'analyses' table by id
2. Get video from 'videos' table by video_id
3. Generate signed URL for video playback
4. Display all data
```

### Task: Create Score Gauge Component
```typescript
// components/ScoreGauge.tsx

Circular progress indicator showing 0-100 score
Props: label (string), score (number), color (string)
Color coding:
- Red: score < 60
- Yellow: 60 ≤ score < 80
- Green: score ≥ 80
Animated count-up effect on load
```

### Task: Create Video Player
```typescript
// components/VideoPlayer.tsx

HTML5 video element with controls
Source: signed URL from Supabase Storage
Controls: play/pause, seek, volume, fullscreen
Responsive sizing
```

---

## PHASE 7: HISTORY PAGE

### Task: Create History Page
```typescript
// app/dashboard/history/page.tsx

Features:
- Fetch all user's analyses ordered by date (newest first)
- Display as grid of cards
- Each card shows: thumbnail, date, overall score, filename
- Click card → navigate to results page
- Pagination (10 items per page)
- Filter by date range
- Sort by date/score
- Empty state when no videos

Card component:
- Thumbnail image (video first frame or placeholder)
- Upload date
- Overall score (large, color-coded)
- Filename
- "View Details" button
```

---

## PHASE 8: DASHBOARD HOME

### Task: Create Dashboard Layout
```typescript
// app/dashboard/layout.tsx

Sidebar navigation with links:
- Home
- Upload
- History
- Profile
- Settings (optional)

Top bar with:
- User avatar (from Clerk)
- User name
- Logout button

Responsive: Hamburger menu on mobile
```

### Task: Dashboard Home Content
```typescript
// app/dashboard/page.tsx

Sections:
1. Statistics cards:
   - Total videos analyzed
   - Average overall score
   - Best kick score
   - Recent improvement (% change)

2. Recent activity:
   - List of 5 most recent analyses
   - Thumbnail, date, score
   - "View All" → History page

3. Quick actions:
   - Large "Upload New Video" button
   - "View Tutorial" button (optional)
```

---

## PHASE 9: UI POLISH

### Task: Add Loading States
```typescript
Create loading spinner component
Add to:
- Upload page (during file upload)
- Results page (during processing)
- History page (while fetching data)
Use skeleton loaders for better UX
```

### Task: Add Error Handling
```typescript
Create error message component (red background, white text)
Handle errors:
- File upload failed
- Processing failed
- Database query failed
- Network errors
Show user-friendly messages
Add retry buttons where appropriate
```

### Task: Add Toast Notifications
```typescript
Install react-hot-toast
Show toasts for:
- Upload success
- Processing complete (optional: browser notification)
- Profile updated
- Settings saved
Style to match brand colors
```

### Task: Make Responsive
```typescript
Test on:
- Mobile (375px width)
- Tablet (768px width)
- Desktop (1440px width)

Fix:
- Navigation (hamburger menu on mobile)
- Score gauges (stack vertically on mobile)
- Video player (full width on mobile)
- History cards (1 column on mobile, 2 on tablet, 3 on desktop)
```

### Task: Add Animations
```typescript
Page transitions (fade in)
Score gauge animations (count up from 0 to actual score)
Card hover effects (scale up slightly)
Button hover effects (change color)
Loading spinner rotation
Keep animations subtle and fast (< 300ms)
```

---

## PHASE 10: DEPLOYMENT

### Task: Deploy Frontend to Vercel
```bash
1. Connect GitHub repo to Vercel
2. Import project
3. Configure environment variables in Vercel dashboard:
   - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   - CLERK_SECRET_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
4. Deploy
5. Test production URL
```

### Task: Deploy ML Worker
```bash
See Phase 5 deployment instructions
Update ML_WORKER_URL environment variable in Supabase Edge Function
Test end-to-end with production URLs
```

---

## PHASE 11: COMPETITION PREP

### Task: Create Demo Video
```
Script outline:
1. Problem: "Analyzing football kick technique is difficult and subjective"
2. Solution: "OpenSport uses AI to provide instant, objective analysis"
3. Demo: Screen recording showing:
   - Register/login
   - Upload video
   - Wait for processing (speed up to 5 seconds)
   - View results with scores and feedback
   - Check history
4. Technology: "Built with Next.js, powered by XGBoost ML models"
5. Call to action: "Try it yourself at [URL]"

Length: 3-5 minutes
Tools: OBS Studio or Loom for recording
Add voiceover and background music
```

### Task: Create Presentation Slides
```
Slide 1: Title
- OpenSport: AI Football Kick Analyzer
- Team name

Slide 2: Problem
- Manual coaching is expensive and subjective
- Players lack instant feedback

Slide 3: Solution
- Upload video → Get instant AI analysis
- 5 detailed metrics + personalized feedback

Slide 4: Technology
- ML: MediaPipe + XGBoost (148 training samples, R² ~0.75)
- Stack: Next.js, Supabase, FastAPI

Slide 5: Demo
- Live demo or show video

Slide 6: Market
- Target: Youth football players, academies, amateur clubs
- 265M football players worldwide

Slide 7: Future
- Team features for coaches
- Mobile app
- Real-time video analysis

Slide 8: Q&A

Keep to 7-10 minutes total
```

### Task: Prepare for Demo
```
Pre-demo checklist:
- Test internet connection
- Charge laptop fully
- Have 3 test videos ready (short, good quality)
- Create test account with sample data
- Clear browser cache
- Close unnecessary apps
- Have backup: offline demo video if live fails
- Print presentation slides as backup
- Bring charger and mobile hotspot
```

---

## CRITICAL PATH (If short on time)

Focus on these tasks ONLY:

1. ✅ Clerk setup (auth pages)
2. ✅ Supabase tables (users, videos, analyses)
3. ✅ Upload page (file upload to Supabase Storage)
4. ✅ Edge Function (call ML API, save results)
5. ✅ Results page (display scores + feedback)
6. ✅ History page (list of past analyses)
7. ✅ Basic dashboard layout
8. ✅ Deploy to Vercel
9. ✅ Deploy ML worker (ngrok is fine)
10. ✅ Create demo video

Skip:
- Settings page
- Teams feature
- Advanced filtering
- Animations (keep simple)
- Profile page customization

---

## AI PROMPTING TIPS

When prompting AI tools, be specific:

**Good prompt example:**
```
Create a Next.js page at app/dashboard/upload/page.tsx with:
- Drag-and-drop zone for video files using react-dropzone
- Display file name, size, and duration after selection
- Validate: only .mp4/.mov files, max 100MB, duration 3-15 seconds
- Show upload progress bar
- Use Tailwind CSS for styling with green primary color
- On success, redirect to /dashboard/results/[id]
```

**Bad prompt example:**
```
Make an upload page
```

**For each task:**
1. Specify file path
2. List exact features needed
3. Mention libraries to use
4. Define data flow (what calls what)
5. Specify styling requirements
6. Mention error handling

---

## FILE STRUCTURE REFERENCE

```
app/
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── dashboard/
│   ├── layout.tsx                    # Sidebar + navigation
│   ├── page.tsx                      # Dashboard home
│   ├── upload/page.tsx               # Video upload
│   ├── results/[id]/page.tsx         # Analysis results
│   └── history/page.tsx              # Past analyses
├── api/
│   └── webhooks/
│       └── clerk/route.ts            # Clerk user sync
└── layout.tsx                        # Root layout with ClerkProvider

components/
├── ScoreGauge.tsx                    # Circular score display
├── VideoPlayer.tsx                   # Video player
├── AnalysisCard.tsx                  # Card for history list
├── LoadingSpinner.tsx                # Loading indicator
└── ErrorMessage.tsx                  # Error display

lib/
├── supabase.ts                       # Supabase client
└── utils.ts                          # Helper functions

supabase/
└── functions/
    └── process-video/
        └── index.ts                  # ML processing function
```

---

## ENVIRONMENT VARIABLES

```env
# Clerk (get from clerk.com dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase (get from supabase.com project settings)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# ML Worker (your deployed FastAPI URL)
ML_WORKER_URL=https://abc123.ngrok-free.app
# OR
ML_WORKER_URL=https://opensport-ml.onrender.com
```

---

## SUCCESS CRITERIA

**Minimum viable demo must have:**
- [ ] User can register and login
- [ ] User can upload a video file
- [ ] Video is analyzed by ML API
- [ ] User sees 5 scores (0-100) for each metric
- [ ] User sees text feedback
- [ ] User can view past analyses
- [ ] Works on mobile (responsive)
- [ ] No crashes or critical bugs

**Good to have:**
- [ ] Loading animations
- [ ] Error handling
- [ ] Toast notifications
- [ ] Video player with controls
- [ ] Filter/sort on history page

**Optional (post-competition):**
- [ ] Teams feature
- [ ] Coach dashboard
- [ ] Advanced analytics
- [ ] Social sharing

---

**Copy sections above directly into AI prompts as needed. Each task is self-contained and can be completed independently.** 🚀
