# OpenSport - System Design & Development Plan

## 📋 EXECUTIVE SUMMARY

**Цель**: Платформа для анализа футбольных ударов с ролями игроков и тренеров
**Срок**: 40 дней до соревнования (середина февраля)
**Команда**: 1 разработчик (ты) + CEO (бизнес/лейблинг)
**Стратегия**: Итеративная разработка - от простого к сложному

---

## 🎯 CORE FUNCTIONALITY (Must-Have для соревнования)

### Минимально жизнеспособный продукт (MVP):

1. **Регистрация/Авторизация** (Clerk)
2. **Загрузка видео** (Player)
3. **AI анализ** (твои модели)
4. **Просмотр результатов** (Player)
5. **История анализов** (Player)

### Расширенный функционал (Nice-to-Have):

6. **Роль тренера** (Coach dashboard)
7. **Команды** (Teams/Clubs)
8. **Аналитика** (Stats & trends)

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                    (React + Next.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Auth    │  │ Upload   │  │ Results  │  │ History  │  │
│  │ (Clerk)  │  │  Page    │  │  Page    │  │  Page    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ API Calls
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    BACKEND LAYER                            │
│                 (Supabase + Edge Functions)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database (PostgreSQL)                               │  │
│  │  - users                                             │  │
│  │  - videos                                            │  │
│  │  - analyses (reports)                                │  │
│  │  - teams (future)                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Storage (S3-compatible)                             │  │
│  │  - Video files                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Edge Function: processVideo()                       │  │
│  │  - Receives upload                                   │  │
│  │  - Calls ML Worker                                   │  │
│  │  - Saves results                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP Call
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    ML WORKER                                │
│              (FastAPI + Your Models)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /analyze                                       │  │
│  │  - Download video                                    │  │
│  │  - Extract poses (MediaPipe)                         │  │
│  │  - Extract features (107)                            │  │
│  │  - Predict scores (XGBoost × 5)                      │  │
│  │  - Return JSON                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Deployment: ngrok (demo) → Render ($7/mo) (production)    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA

### Phase 1: MVP Schema

```sql
-- Clerk handles auth, we just store reference
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,  -- Clerk user ID
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'player',  -- 'player' | 'coach' | 'admin'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Video uploads
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,  -- Supabase Storage path
  filename TEXT NOT NULL,
  duration FLOAT,
  file_size_mb FLOAT,
  status TEXT DEFAULT 'processing',  -- 'processing' | 'completed' | 'failed'
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Analysis results
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  
  -- AI scores
  stability FLOAT NOT NULL,
  power FLOAT NOT NULL,
  technique FLOAT NOT NULL,
  balance FLOAT NOT NULL,
  overall FLOAT NOT NULL,
  
  -- AI feedback
  feedback TEXT NOT NULL,
  tags JSONB,  -- ['excellent_power', 'weak_stability']
  
  -- Metadata
  processing_time_ms INTEGER,
  model_version TEXT DEFAULT 'xgboost_v1.0',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_video_id ON analyses(video_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
```

### Phase 2: Teams Feature (After MVP)

```sql
-- Teams/Clubs
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  coach_id UUID REFERENCES users(id),  -- Coach/owner
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team memberships
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'player',  -- 'player' | 'assistant_coach'
  joined_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(team_id, user_id)  -- User can only be in team once
);

-- Indexes
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
```

---

## 🔐 AUTHENTICATION: Clerk vs Custom

### ✅ РЕКОМЕНДАЦИЯ: Используй Clerk

**Что Clerk делает ЗА ТЕБЯ:**
- ✅ Хранит users + passwords (bcrypt hashing)
- ✅ Session management
- ✅ Email verification
- ✅ Password reset
- ✅ OAuth (Google, GitHub, etc.)
- ✅ JWT tokens
- ✅ Rate limiting
- ✅ Security best practices

**Что ТЕБЕ надо сделать:**
- Создать `users` таблицу в Supabase для доп. данных (role, team_id, etc.)
- Синхронизировать Clerk user → Supabase user через webhook

### Clerk Integration Flow:

```
1. User registers → Clerk creates account
2. Clerk webhook fires → /api/webhooks/clerk
3. Your backend creates user record in Supabase:
   {
     clerk_id: "user_xxx",
     email: "player@example.com",
     role: "player"
   }
4. User logs in → Clerk returns JWT
5. Frontend includes JWT in all API calls
6. Backend verifies JWT → gets clerk_id → queries Supabase
```

**Защита данных:**
- Clerk = enterprise-grade security (GDPR compliant)
- Passwords = никогда не хранятся в plain text
- JWT = автоматически expires
- Для соревнования - более чем достаточно

---

## 📊 DATA FLOW: User Journey

### Flow 1: Player Uploads Video

```
┌──────┐
│ USER │ Logs in with Clerk
└──┬───┘
   │
   ▼
┌──────────────────┐
│ Upload Page      │ Select video file (3-15 sec)
└──┬───────────────┘
   │
   ▼
┌──────────────────┐
│ Frontend         │ 1. Upload to Supabase Storage
│                  │ 2. Create video record in DB
│                  │ 3. Call Edge Function
└──┬───────────────┘
   │
   ▼
┌──────────────────┐
│ Edge Function    │ 1. Get signed URL for video
│ processVideo()   │ 2. Call ML Worker API
└──┬───────────────┘
   │
   ▼
┌──────────────────┐
│ ML Worker        │ 1. Download video
│ (FastAPI)        │ 2. Extract poses
│                  │ 3. Extract features
│                  │ 4. Predict scores (5 models)
│                  │ 5. Return JSON
└──┬───────────────┘
   │
   ▼
┌──────────────────┐
│ Edge Function    │ 1. Receive scores
│                  │ 2. Save to analyses table
│                  │ 3. Update video status
│                  │ 4. Return to frontend
└──┬───────────────┘
   │
   ▼
┌──────────────────┐
│ Results Page     │ Display:
│                  │ - 5 scores (gauges)
│                  │ - Feedback text
│                  │ - Video playback
└──────────────────┘
```

### Flow 2: Player Views History

```
1. User → History Page
2. Frontend → Query Supabase:
   SELECT a.*, v.filename, v.uploaded_at
   FROM analyses a
   JOIN videos v ON a.video_id = v.id
   WHERE a.user_id = $current_user_id
   ORDER BY a.created_at DESC
3. Display as cards/list
4. Click card → Navigate to Results Page
```

### Flow 3: Coach Views Team (Future)

```
1. Coach → Team Dashboard
2. Frontend → Query Supabase:
   SELECT u.name, a.*
   FROM analyses a
   JOIN users u ON a.user_id = u.id
   JOIN team_members tm ON u.id = tm.user_id
   WHERE tm.team_id = $coach_team_id
   ORDER BY a.created_at DESC
3. Display aggregated stats:
   - Team average scores
   - Individual player trends
   - Top performers
```

---

## 🛠️ DEVELOPMENT STRATEGY

### ❌ НЕ ДЕЛАЙ ТАК:
- Frontend целиком → Backend целиком (долго до первого результата)
- Backend целиком → Frontend целиком (не видишь прогресс)

### ✅ ДЕЛАЙ ТАК: Vertical Slicing

**Принцип**: Каждую неделю имей working feature end-to-end

**Week 1**: MVP Authentication
- Frontend: Login/Register page (Clerk)
- Backend: Clerk webhook → Create user in Supabase
- Test: User can register and see dashboard

**Week 2**: MVP Upload + Analysis
- Frontend: Upload page (single video)
- Backend: Upload to Storage → Call ML Worker → Save result
- Test: User can upload video and see "Processing..."

**Week 3**: MVP Results Display
- Frontend: Results page (scores + feedback)
- Backend: Fetch analysis from DB
- Test: User sees AI scores after upload completes

**Week 4**: MVP History
- Frontend: History page (list of past analyses)
- Backend: Query user's analyses
- Test: User can view all past videos

**Week 5**: Polish + Deploy
- UI improvements
- Error handling
- Loading states
- Deploy ML worker to Render

**Week 6**: Test + Fix Bugs
- End-to-end testing
- Fix critical bugs
- Performance optimization

**Week 7**: Competition Prep
- Demo video
- Presentation
- Backup plans

---

## 🎨 FRONTEND STRUCTURE

```
app/
├── (auth)/
│   ├── sign-in/
│   │   └── page.tsx          # Clerk sign-in page
│   └── sign-up/
│       └── page.tsx          # Clerk sign-up page
│
├── (dashboard)/
│   ├── layout.tsx            # Dashboard layout (requires auth)
│   ├── page.tsx              # Dashboard home
│   │
│   ├── upload/
│   │   └── page.tsx          # Video upload page
│   │
│   ├── results/
│   │   └── [id]/
│   │       └── page.tsx      # Single analysis results
│   │
│   ├── history/
│   │   └── page.tsx          # User's analysis history
│   │
│   └── team/                 # Future: Coach features
│       ├── page.tsx          # Team dashboard
│       └── [playerId]/
│           └── page.tsx      # Player details
│
├── api/
│   └── webhooks/
│       └── clerk/
│           └── route.ts      # Clerk webhook handler
│
└── components/
    ├── VideoUploader.tsx
    ├── ScoreGauge.tsx
    ├── AnalysisCard.tsx
    └── ...
```

---

## 🔧 BACKEND STRUCTURE

### Supabase Edge Functions

```
supabase/functions/
├── process-video/
│   └── index.ts              # Main: Upload → ML → Save
│
├── get-user-analyses/
│   └── index.ts              # Fetch user's history
│
└── get-team-stats/           # Future: Team analytics
    └── index.ts
```

### Key Edge Function: process-video

```typescript
// Simplified pseudocode
async function processVideo(videoId: string) {
  // 1. Get video details from DB
  const video = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single()
  
  // 2. Generate signed URL for ML worker
  const { signedUrl } = await supabase
    .storage
    .from('videos')
    .createSignedUrl(video.storage_path, 3600)
  
  // 3. Call ML Worker
  const mlResponse = await fetch(`${ML_WORKER_URL}/analyze`, {
    method: 'POST',
    body: JSON.stringify({ video_url: signedUrl })
  })
  
  const analysis = await mlResponse.json()
  
  // 4. Save analysis to DB
  await supabase.from('analyses').insert({
    video_id: videoId,
    user_id: video.user_id,
    stability: analysis.scores.stability,
    power: analysis.scores.power,
    technique: analysis.scores.technique,
    balance: analysis.scores.balance,
    overall: analysis.scores.overall,
    feedback: analysis.feedback,
    tags: analysis.tags
  })
  
  // 5. Update video status
  await supabase
    .from('videos')
    .update({ status: 'completed' })
    .eq('id', videoId)
  
  return analysis
}
```

---

## 🔄 DEVELOPMENT WORKFLOW

### Daily Routine:

```
1. Morning: Pick ONE vertical slice
   Example: "Today I build upload page + backend integration"

2. Start with Frontend:
   - Create UI mockup
   - Build React component
   - Add form/validation
   - Test locally

3. Then Backend:
   - Create Supabase table (if needed)
   - Write Edge Function
   - Test with Postman/curl
   - Connect to frontend

4. Test End-to-End:
   - Full flow from UI to DB
   - Check all edge cases
   - Fix bugs immediately

5. Commit & Deploy:
   - git commit -m "feat: video upload page"
   - Deploy to Vercel (auto-deploy)
   - Test in production

6. Repeat tomorrow with NEXT vertical slice
```

### Week-by-Week Breakdown:

**Week 1 (Jan 6-12): Authentication**
- Day 1-2: Setup Clerk + create sign-in/sign-up pages
- Day 3-4: Clerk webhook → Supabase user sync
- Day 5: Dashboard home page (empty state)
- Day 6-7: Testing + polish

**Week 2 (Jan 13-19): Upload + ML Integration**
- Day 1-2: Video upload component
- Day 3: Supabase Storage upload
- Day 4: Edge Function to call ML Worker
- Day 5: Deploy ML Worker (ngrok for now)
- Day 6-7: End-to-end test + error handling

**Week 3 (Jan 20-26): Results Display**
- Day 1-2: Results page UI (scores, feedback)
- Day 3: Fetch analysis from DB
- Day 4: Video playback component
- Day 5: Loading states + animations
- Day 6-7: Polish UI

**Week 4 (Jan 27-Feb 2): History**
- Day 1-2: History page (list view)
- Day 3: Pagination
- Day 4: Search/filter
- Day 5: Details view
- Day 6-7: Responsive design

**Week 5 (Feb 3-9): Deploy + Polish**
- Day 1-2: Deploy ML Worker to Render
- Day 3-4: Performance optimization
- Day 5: Error handling everywhere
- Day 6-7: Final UI polish

**Week 6 (Feb 10-16): Competition Prep**
- Day 1-2: Create demo video
- Day 3-4: Presentation slides
- Day 5-7: Practice pitch, backup plans

---

## 🎯 MVP vs FUTURE Features

### MVP (Must have for competition):

| Feature | Priority | Complexity | Time |
|---------|----------|------------|------|
| Auth (Clerk) | P0 | Low | 2 days |
| Upload video | P0 | Medium | 3 days |
| ML analysis | P0 | Medium | 3 days |
| Show results | P0 | Low | 2 days |
| History list | P0 | Low | 2 days |
| **Total** | | | **12 days** |

### Nice-to-Have (If time permits):

| Feature | Priority | Complexity | Time |
|---------|----------|------------|------|
| Team creation | P1 | Medium | 4 days |
| Coach dashboard | P1 | High | 5 days |
| Analytics charts | P2 | Medium | 3 days |
| Video comparison | P2 | High | 4 days |

### Post-Competition (Future):

- Social features (share results)
- Payment integration
- Advanced analytics
- Mobile app
- Batch upload
- Real-time feedback

---

## 🚨 RISK MITIGATION

### Risk 1: ML Worker Downtime
**Mitigation**: 
- Use ngrok for demo (can restart instantly)
- Have backup Render deployment ready
- Fallback: Show pre-computed results for demo

### Risk 2: Supabase Free Tier Limits
**Limits**: 500MB DB, 1GB storage, 2GB bandwidth
**Mitigation**:
- Videos stay in storage only during processing
- After analysis, offer download link then delete
- Compress videos before upload

### Risk 3: Slow ML Processing
**Current**: ~30 seconds per video
**Mitigation**:
- Show "Analyzing... this takes 30-60 seconds" message
- Add progress bar animation
- Email notification when done (future)

### Risk 4: Scope Creep
**Mitigation**:
- STRICT MVP feature freeze after Week 4
- Say NO to new features during competition prep
- Write them down for "v2.0"

---

## 📦 DEPLOYMENT PLAN

### Frontend (Vercel)
- Already set up (auto-deploy on git push)
- Environment variables: NEXT_PUBLIC_CLERK_*

### Backend (Supabase)
- Database: Already set up
- Storage: Already set up
- Edge Functions: Deploy with Supabase CLI

### ML Worker
- **Phase 1 (Weeks 1-4)**: ngrok (local development)
- **Phase 2 (Week 5)**: Render.com Starter ($7/mo)
- **Backup**: Railway.app

---

## 💰 COST ESTIMATE

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| Clerk | Free | $0 | Up to 5,000 MAUs |
| Supabase | Free | $0 | Sufficient for demo |
| Vercel | Free | $0 | Hobby tier |
| Render | Starter | $7/mo | Only during competition |
| Domain (optional) | | $10/yr | opensport.com |
| **Total** | | **$7-14** | For 1-2 months |

---

## ✅ SUCCESS CRITERIA

### Technical:
- [ ] User can register/login (Clerk)
- [ ] User can upload video
- [ ] Video processed in <60 seconds
- [ ] AI returns 5 scores + feedback
- [ ] User can view past analyses
- [ ] 95% uptime during demo
- [ ] Mobile responsive

### Business (Competition):
- [ ] Working demo video (3-5 min)
- [ ] Presentation ready
- [ ] Can handle live demo
- [ ] Impressive UI/UX
- [ ] Clear value proposition

---

## 🎓 KEY DECISIONS SUMMARY

### ✅ RECOMMENDED APPROACH:

1. **Development**: Vertical slicing (feature by feature)
2. **Auth**: Clerk (not custom)
3. **Database**: Supabase PostgreSQL
4. **Storage**: Supabase Storage
5. **ML Deployment**: ngrok → Render
6. **MVP First**: Auth + Upload + Results + History
7. **Teams Later**: After competition if time permits

### 📅 TIMELINE:

- Weeks 1-4: MVP development
- Week 5: Deploy + polish
- Week 6: Testing + fixes
- Week 7: Competition prep

### 🎯 FOCUS:

**Do**: MVP features, clean code, good UX
**Don't**: Over-engineer, add unnecessary features, perfectionism

---

## 📝 NEXT IMMEDIATE STEPS

1. **Today**: Setup Clerk in your Next.js app
2. **Tomorrow**: Create users table in Supabase
3. **Day 3**: Build upload page UI
4. **Day 4**: Connect upload to Supabase Storage
5. **Day 5**: Create Edge Function to call ML Worker

Start with Day 1 and report back! 🚀

---

**Last Updated**: January 6, 2025
**Status**: Planning Complete, Ready to Start Development
**Timeline**: 40 days to competition
