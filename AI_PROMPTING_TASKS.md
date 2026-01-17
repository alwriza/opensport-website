## Known Issues & Priorities

### 🔴 CRITICAL (Security/Legal)

#### 1. Storage Security
**Problem:** Videos bucket may be public, violating Privacy Policy
**Location:** Supabase Storage settings + all video access code
**Impact:** Privacy violation, legal risk, data exposure
**Fix Required:**
- Make videos bucket private
- Replace `getPublicUrl()` with `createSignedUrl(path, 3600)`
- Update all video fetching code in PlayerDashboard, CoachDashboard
- Add RLS policies for storage.objects
- Use user-scoped paths: `{user_id}/{filename}`

**Code locations to fix:**
```typescript
// PlayerDashboard.tsx - fetchVideos()
// CoachDashboard.tsx - loadPlayerProfile()
// Any video upload logic
```

#### 2. Terms Acceptance Enforcement
**Problem:** Users might bypass terms acceptance modal
**Location:** PlayerDashboard.tsx, CoachDashboard.tsx
**Fix Required:**
- Verify modal cannot be closed (onEscapeKeyDown prevented)
- Block all functionality until terms accepted
- Check terms_accepted_at before any data operations

#### 6. Video Upload Error Handling
**Problem:** Need better error handling for upload failures
**Location:** PlayerDashboard.tsx - handleVideoUpload()
**Fix Required:**
- File size validation (50MB max)
- File type validation (.mp4, .mov, .avi)
- Clear error messages
- Progress indicator
- Retry mechanism


#### 8. Streak Calculation
**Problem:** Verify streak logic handles timezones correctly
**Location:** Training.tsx - completeLevel()
**Logic:**
- Same day: no change
- Yesterday: increment
- Gap >1 day: reset to 1
- Track current_streak


#### 9. Player Overlay 
**Problem:** when clicking it loads very long
**Logic:**
- player clicks on "view previous analysis" on PlayerDashboard
-  playeroverlay starts loading
- it is loading while being opened(just the content is loading the overlay is opened fast)


В PlayerDashboard.tsx должно быть так:
typescriptconst fetchVideos = async (userId: string) => {
  setLoading(true);
  try {
    // 1. Fetch video records from database
    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        *,
        analyses (
          id,
          overall,
          stability,
          power,
          technique,
          balance,
          feedback,
          tags,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    // 2. Generate signed URLs for each video
    const videosWithUrls = await Promise.all(
      (videos || []).map(async (video) => {
        // ✅ This creates a temporary URL that expires in 1 hour
        const { data: urlData, error: urlError } = await supabase.storage
          .from('videos')
          .createSignedUrl(video.storage_path, 3600); // 3600 seconds = 1 hour

        if (urlError) {
          console.error('Error creating signed URL:', urlError);
          return { ...video, signedUrl: null };
        }

        return {
          ...video,
          signedUrl: urlData.signedUrl
        };
      })
    );

    setVideos(videosWithUrls);
  } catch (error: any) {
    console.error('Error fetching videos:', error);
    toast({
      title: "Error",
      description: "Could not load videos",
      variant: "destructive"
    });
  } finally {
    setLoading(false);
  }
};
⏱️ ЧТО НАСЧЕТ EXPIRATION?
Проблема:
Signed URL expires через 1 час → видео перестанет играть.
Решение 1: Auto-refresh (простое):
typescript// В PlayerDashboard.tsx
useEffect(() => {
  if (!dbUser) return;

  // Initial fetch
  fetchVideos(dbUser.id);

  // Refresh signed URLs every 50 minutes (before they expire)
  const interval = setInterval(() => {
    fetchVideos(dbUser.id);
  }, 50 * 60 * 1000); // 50 minutes

  return () => clearInterval(interval);
}, [dbUser]);
Решение 2: Refresh on demand (лучше):
typescript// Только когда пользователь открывает видео
const openVideoModal = async (video: Video) => {
  // Generate fresh signed URL
  const { data } = await supabase.storage
    .from('videos')
    .createSignedUrl(video.storage_path, 3600);
  
  setSelectedVideo({
    ...video,
    signedUrl: data?.signedUrl || null
  });
  
  setVideoModalOpen(true);
};
```