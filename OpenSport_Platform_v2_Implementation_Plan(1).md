**OpenSport v2.0**

Implementation Plan

*Step-by-step guide for AI coding agents*

# **1\. What We Are Building**

This document describes exact implementation steps for adding subscription system, Global Ranking page, and extended Coach Dashboard to OpenSport platform.

## **1.1 New Features Summary**

| Feature | Description | Priority |
| :---- | :---- | :---- |
| Registration Flow | Choose Player or Individual track after signup | P0 |
| Pricing Page | Stripe checkout for subscriptions | P0 |
| Usage Limits | Track kicks/moments/matches per period | P0 |
| Global Ranking | Shadow leaderboard for Players, full for Individual | P1 |
| Extended Coach Dashboard | Compare tool, heatmaps, notes for Individual | P2 |
| Watchlist | Scouts save players, players see view count | P2 |

\[1.1.1\] Add is\_admin column to users table, update useSubscription to return max permissions if is\_admin \= true, skip limit checks for admin

## **1.2 User Types and Tracks**

Two separate tracks with different subscriptions:

* PLAYER TRACK: Player FREE ($0) and Player PREMIUM ($5/mo)

* INDIVIDUAL TRACK: Individual BASIC ($25/mo) and Individual PRO ($75/mo)

User chooses track at registration. Cannot access other track features.

# **2\. Database Changes**

All changes to Supabase PostgreSQL schema.

## **2.1 Modify users Table**

Add these columns to existing users table:

user\_track: TEXT CHECK (user\_track IN ('player', 'individual')) DEFAULT 'player'

subscription\_tier: TEXT CHECK (subscription\_tier IN ('free', 'premium', 'basic', 'pro')) DEFAULT 'free'

stripe\_customer\_id: TEXT

stripe\_subscription\_id: TEXT

subscription\_status: TEXT CHECK (subscription\_status IN ('active', 'cancelled', 'past\_due', 'none')) DEFAULT 'none'

track\_switch\_count: INTEGER DEFAULT 0

created\_at: TIMESTAMPTZ DEFAULT NOW()

is\_admin: BOOLEAN DEFAULT false

## **2.2 Create usage\_limits Table**

Track how many analyses user has done in current period:

id: UUID PRIMARY KEY

user\_id: UUID REFERENCES users(id)

period\_type: TEXT ('daily', 'weekly', 'monthly')

period\_start: DATE

kicks\_used: INTEGER DEFAULT 0

moments\_used: INTEGER DEFAULT 0

player\_matches\_used: INTEGER DEFAULT 0

team\_matches\_used: INTEGER DEFAULT 0

UNIQUE(user\_id, period\_type, period\_start)

## **2.3 Create watchlist Table**

Scouts save players they are interested in:

id: UUID PRIMARY KEY

scout\_id: UUID REFERENCES users(id)

player\_id: UUID REFERENCES users(id)

notes: TEXT

created\_at: TIMESTAMPTZ DEFAULT NOW()

UNIQUE(scout\_id, player\_id)

## **2.4 Create scout\_views Table**

Track when scouts view player profiles:

id: UUID PRIMARY KEY

scout\_id: UUID REFERENCES users(id)

player\_id: UUID REFERENCES users(id)

viewed\_at: TIMESTAMPTZ DEFAULT NOW()

## **2.5 Create player\_notes Table**

Private notes coaches write about players:

id: UUID PRIMARY KEY

coach\_id: UUID REFERENCES users(id)

player\_id: UUID REFERENCES users(id)

note\_text: TEXT

tags: TEXT\[\]

created\_at: TIMESTAMPTZ DEFAULT NOW()

updated\_at: TIMESTAMPTZ DEFAULT NOW()

## **2.6 Create talent\_alerts Table**

PRO scouts get notified when matching players appear:

id: UUID PRIMARY KEY

user\_id: UUID REFERENCES users(id)

filters: JSONB

is\_active: BOOLEAN DEFAULT true

last\_triggered: TIMESTAMPTZ

created\_at: TIMESTAMPTZ DEFAULT NOW()

## **2.7 Create player\_rankings View or Table**

Aggregated scores for Global Ranking. Can be materialized view refreshed hourly:

user\_id: UUID

overall\_score: DECIMAL

total\_analyses: INTEGER

rank\_position: INTEGER

percentile: DECIMAL

last\_updated: TIMESTAMPTZ

# **3\. Registration Flow Implementation**

## **3.1 Track Selection Modal**

After Clerk signup completes, show modal asking user to choose track.

### **What to build:**

* Modal component with two cards: Player and Individual

* Player card: Icon, title, description (I want to improve my skills)

* Individual card: Icon, title, description (I am a coach or scout)

* No skip button \- user must choose

### **Logic:**

* If user selects Player: Set user\_track='player', subscription\_tier='free', redirect to /player-dashboard

* If user selects Individual: Set user\_track='individual', redirect to /pricing

### **When to show:**

* Check if user\_track is NULL or undefined

* Show modal on any page load until track is set

* Store selection immediately in database

## **3.2 Pricing Page**

Show subscription options based on user track.

### **For Players (user\_track \= 'player'):**

* Show FREE tier (current plan) and PREMIUM ($5/mo)

* FREE features: 5 kicks/day, 1 moment/week, 2 matches/month, ads

* PREMIUM features: Unlimited kicks, 5 moments/week, 4 matches/month, no ads, Pro badge, PDF export

### **For Individuals (user\_track \= 'individual'):**

* Show BASIC ($25/mo) and PRO ($75/mo)

* BASIC: View profiles, basic filters, 20 watchlist, 3 compare, 10 player matches, 4 team matches

* PRO: Advanced filters, unlimited watchlist/compare, 50 player matches, 10 team matches, alerts, contact

### **Stripe Integration:**

* Create Stripe products for each tier in Stripe Dashboard

* Create checkout session when user clicks Subscribe

* Handle webhook for successful payment

* Update user subscription\_tier and subscription\_status

# **4\. Usage Limits System**

## **4.1 Limit Values by Tier**

| Analysis Type | FREE | PREMIUM | BASIC | PRO |
| :---- | :---- | :---- | :---- | :---- |
| Kicks per day | 5 | unlimited | \- | \- |
| Moments per week | 1 | 5 | \- | \- |
| Player matches per month | 2 | 4 | 10 | 50 |
| Team matches per month | 0 | 0 | 4 | 10 |

## **4.2 Check Limits Before Upload**

Before allowing video upload, check if user has remaining quota.

### **Logic flow:**

* 1\. Get user subscription\_tier

* 2\. Get or create usage\_limits record for current period

* 3\. Compare used vs allowed based on tier

* 4\. If limit reached: Show upgrade prompt, block upload

* 5\. If limit available: Allow upload, increment counter after success

### **Period reset logic:**

* Daily limits (kicks): Reset at midnight user timezone or UTC

* Weekly limits (moments): Reset on Monday

* Monthly limits (matches): Reset on 1st of month

## **4.3 Display Remaining Limits**

Show user how many analyses they have left.

### **Where to show:**

* Player Dashboard: Card or badge showing 3/5 kicks today, 1/1 moments this week

* Upload Modal: Warning if close to limit

* After analysis: Updated count

## **4.4 Upgrade Prompt**

When limit reached, show upgrade modal.

### **Content:**

* Title: You have reached your daily limit

* Body: Upgrade to Premium for unlimited kick analyses

* CTA button: View Plans (links to /pricing)

* Secondary: Or wait until tomorrow

# **5\. Global Ranking Page**

URL: /ranking

## **5.1 Two Modes**

Page renders differently based on user subscription:

* SHADOW MODE: For Player FREE and Player PREMIUM

* FULL MODE: For Individual BASIC and Individual PRO

## **5.2 Shadow Mode (Players)**

Players see their position but cannot identify other players.

### **Components to build:**

### **A. Your Position Card**

* Large number showing rank: \#847

* Total players: of 12,431 players

* Percentile bar: Top 7%

* Weekly change: \+23 positions this week (green if up, red if down)

### **B. Benchmarks Card**

* Top 1% threshold: 95+

* Top 10% threshold: 88+

* Top 25% threshold: 82+

* Average score: 71

* Your score: 84.0 (Top 18%)

### **C. Shadow Leaderboard**

* Table with columns: Rank, Player ID, Score

* Player ID format: Player \#8492 (random hash, not real ID)

* NO real names, NO age, NO position, NO location

* Highlight current user row with star icon

* FREE: Show 5 above and 5 below user

* PREMIUM: Show 20 above and 20 below user

### **D. Upgrade CTA Card**

* Title: Want to see who is ahead of you?

* List: Real player names, Video analyses, Contact players

* Button: See Plans (link to /pricing)

## **5.3 Full Mode (Individual)**

Scouts and coaches see full player information.

### **Components to build:**

### **A. Filter Bar**

* Position dropdown: All, GK, DEF, MID, ST

* Age dropdown: All, U15, U16, U17, U18, U19, U21+

* Country dropdown: All, KZ, RU, UZ, etc.

* City text input with autocomplete

* Reset Filters button

* PRO ONLY: Score range slider, Combined filters

### **B. Full Leaderboard Table**

* Columns: Rank, Photo, Name, Age, Position, Location, Score

* Photo: Small avatar or placeholder

* Name: Real name with link to profile

* Clickable rows open player profile

### **C. Action Buttons per Row**

* View button: Opens player profile overlay

* Watchlist button: Add/remove from watchlist (toggle star)

* Contact button: PRO only, locked icon for BASIC

### **D. Pagination**

* Show 20-50 players per page

* Page numbers or infinite scroll

## **5.4 Ranking Calculation**

How to calculate player scores and ranks:

* Only count analyses uploaded by players themselves (not coach uploads)

* Overall score \= weighted average of recent analyses

* Weight recent analyses more than old ones

* Minimum 3 analyses to appear in ranking

* Refresh rankings hourly or on-demand

# **6\. Coach Dashboard Extensions**

URL: /coach-dashboard

## **6.1 Current State (Keep As Is)**

Simple version for Player FREE/PREMIUM:

* Team roster table

* Invite Code for adding players

* View Results button per player

* Basic team stats

## **6.2 Extended Version (Individual Only)**

Additional features visible only to Individual BASIC/PRO users.

### **A. Compare Tool**

Side-by-side player comparison.

* UI: Select 2-3 players from dropdowns or search

* BASIC limit: 3 players max

* PRO limit: unlimited

* Display radar chart with metrics: Power, Technique, Balance, Stability, Overall

* Display comparison table: Metric | Player A | Player B | Difference

* Highlight winner for each metric (green)

* Use any charting library you have (recharts, chart.js)

### **B. Team Heatmap**

Tactical position map from match analyses.

* Only available if team has match analyses

* Show 2D football pitch

* Overlay heatmap of player positions

* Dropdown to select specific player or All team

* Dropdown to select match or aggregate

* Color gradient: blue (low) to red (high activity)

### **C. Team Analytics Card**

Aggregate statistics for the team.

* Average team score vs platform average

* Strongest metric (e.g., Team excels at Power)

* Weakest metric (e.g., Team needs work on Balance)

* Progress chart: Team average over last 3 months

### **D. Player Notes**

Private notes only coach can see.

* Notes icon/button on each player row

* Click opens modal or sidebar

* Text area for notes

* Tags input (e.g., high potential, needs work, ready for promotion)

* Save button, auto-save optional

* Notes stored in player\_notes table

* Only visible to coach who wrote them

### **E. Export Reports (PRO)**

Download team data as file.

* Button: Export Team Report

* BASIC: Basic PDF with roster and scores

* PRO: Full PDF with charts \+ Excel with raw data

* Generate on server or client-side

# **7\. Watchlist Feature**

For Individual users to save interesting players.

## **7.1 Adding to Watchlist**

* Star/bookmark icon on player rows in Global Ranking

* Click to add, click again to remove

* Show toast: Added to watchlist / Removed from watchlist

* BASIC limit: 20 players (show count: 18/20)

* PRO limit: unlimited

## **7.2 Watchlist Page or Tab**

* Accessible from Coach Dashboard or separate page

* Table of saved players with same columns as ranking

* Sort by: Date added, Score, Name

* Remove button per row

* Add notes directly from watchlist

## **7.3 Player Notification**

Players see that scouts are interested in them.

* On Player Dashboard: Card showing X scouts have saved your profile

* Do not show scout names or details

* Update count by querying watchlist table

* Also show: Your profile was viewed X times this month

# **8\. Talent Alerts (PRO Only)**

Automated notifications when matching players join.

## **8.1 Create Alert**

* Button in Global Ranking: Create Alert

* Modal with filter options: Position, Age, Country, Min Score

* Save creates record in talent\_alerts table

* Show list of active alerts

## **8.2 Trigger Logic**

* Run daily job or on new player analysis

* Check each alert filters against new/updated players

* If match found: Send notification (email or in-app)

* Update last\_triggered timestamp

## **8.3 Manage Alerts**

* List of alerts with filters shown

* Toggle active/inactive

* Delete alert

* Edit filters

# **9\. Contact Player (PRO Only)**

PRO scouts can request contact with players.

## **9.1 Contact Button**

* Shown in Global Ranking and player profiles

* BASIC users see locked icon with Upgrade to PRO tooltip

* PRO users see active button

## **9.2 Contact Flow**

* Click Contact opens modal

* Scout writes message

* Message stored in database (new messages table)

* Player receives notification

* Player can view message in their dashboard

* Player can reply or ignore

## **9.3 Simple Implementation**

For MVP, can be simpler:

* Contact button sends email to player (if they have email)

* Or just reveals player email to scout

* Or shows Request Sent confirmation, handled manually

# **10\. Access Control Implementation**

## **10.1 Middleware Check**

Check user permissions on protected routes.

### **Route protection:**

* /player-dashboard: Require user\_track \= 'player'

* /coach-dashboard: Allow all, filter content by subscription

* /ranking: Allow all, filter content by subscription

* /pricing: Allow all

### **Redirect logic:**

* Individual trying to access /player-dashboard: Redirect to /coach-dashboard

* Player trying to use Individual features: Show upgrade prompt

## **10.2 useSubscription Hook**

Create hook that returns current subscription info.

### **Returns:**

* tier: 'free' | 'premium' | 'basic' | 'pro'

* track: 'player' | 'individual'

* isPlayer: boolean

* isIndividual: boolean

* canViewProfiles: boolean (basic, pro)

* canUseAdvancedFilters: boolean (pro)

* canContact: boolean (pro)

* canExport: boolean (premium, basic, pro)

* watchlistLimit: number | null

* compareLimit: number | null

* `isAdmin: boolean` и описание что если `isAdmin = true`, все permissions возвращаются как PRO независимо от реального tier.

## **10.3 FeatureGate Component**

Wrapper component for subscription-gated features.

### **Usage:**

\<FeatureGate requires='canContact' fallback={\<UpgradePrompt /\>}\>

  \<ContactButton /\>

\</FeatureGate\>

## **10.4 Content Filtering**

Same page shows different content based on subscription.

### **Pattern:**

const { isIndividual, tier } \= useSubscription()

if (isIndividual) return \<FullLeaderboard /\>

return \<ShadowLeaderboard showExtra={tier \=== 'premium'} /\>

# **11\. Stripe Integration Details**

## **11.1 Stripe Products to Create**

Create these in Stripe Dashboard:

* Product: OpenSport Premium, Price: $5/month, Price ID: price\_premium\_monthly

* Product: OpenSport Basic, Price: $25/month, Price ID: price\_basic\_monthly

* Product: OpenSport Pro, Price: $75/month, Price ID: price\_pro\_monthly

## **11.2 Checkout Flow**

* 1\. User clicks Subscribe on pricing page

* 2\. Frontend calls POST /api/stripe/create-checkout

* 3\. Backend creates Stripe Checkout Session with price\_id and user metadata

* 4\. Backend returns session URL

* 5\. Frontend redirects to Stripe Checkout

* 6\. User completes payment

* 7\. Stripe redirects to success\_url with session\_id

* 8\. Webhook receives checkout.session.completed event

* 9\. Backend updates user subscription in database

## **11.3 Webhook Events to Handle**

* checkout.session.completed: Activate subscription

* customer.subscription.updated: Handle plan changes

* customer.subscription.deleted: Downgrade to free

* invoice.payment\_failed: Set status to past\_due

## **11.4 Cancel Flow**

* User clicks Cancel Subscription in settings

* Call Stripe API to cancel at period end

* User keeps access until period ends

* When period ends, webhook fires, downgrade user

# **12\. Implementation Order (Roadmap)**

Follow this order to build features with proper dependencies.

## **Sprint 1: Foundation**

1. **\[1.1\]** Add new columns to users table (user\_track, subscription\_tier, stripe fields)

   \[1.1.1\] Add is\_admin column to users table, update useSubscription to return max permissions if is\_admin \= true, skip limit checks for admin

2. **\[1.2\]** Create usage\_limits table

3. **\[1.3\]** Create useSubscription hook

4. **\[1.4\]** Create FeatureGate component

5. **\[1.5\]** Build Track Selection Modal

6. **\[1.6\]** Add track selection logic after Clerk signup

## **Sprint 2: Payments**

7. **\[2.1\]** Create Stripe products in dashboard

8. **\[2.2\]** Build Pricing page UI with all 4 tiers

9. **\[2.3\]** Create /api/stripe/create-checkout endpoint

10. **\[2.4\]** Create /api/stripe/webhook endpoint

11. **\[2.5\]** Handle checkout.session.completed webhook

12. **\[2.6\]** Add subscription status display to user profile

13. **\[2.7\]** Build Cancel Subscription flow

## **Sprint 3: Usage Limits**

14. **\[3.1\]** Create /api/limits/check endpoint

15. **\[3.2\]** Create /api/limits/consume endpoint

16. **\[3.3\]** Add limit check before video upload

17. **\[3.4\]** Build LimitDisplay component

18. **\[3.5\]** Build UpgradePrompt modal

19. **\[3.6\]** Add limits display to Player Dashboard

20. **\[3.7\]** Set up daily/weekly/monthly reset cron job

## **Sprint 4: Global Ranking \- Shadow Mode**

21. **\[4.1\]** Create player\_rankings materialized view or table

22. **\[4.2\]** Create /api/ranking/position endpoint (user position and benchmarks)

23. **\[4.3\]** Create /api/ranking/leaderboard endpoint (shadow version)

24. **\[4.4\]** Build Your Position Card component

25. **\[4.5\]** Build Benchmarks Card component

26. **\[4.6\]** Build Shadow Leaderboard component

27. **\[4.7\]** Build Ranking page with shadow mode

28. **\[4.8\]** Add ranking refresh logic (hourly job)

## **Sprint 5: Global Ranking \- Full Mode**

29. **\[5.1\]** Create watchlist table

30. **\[5.2\]** Create scout\_views table

31. **\[5.3\]** Create /api/ranking/search endpoint with filters

32. **\[5.4\]** Build Filter Bar component

33. **\[5.5\]** Build Full Leaderboard component

34. **\[5.6\]** Add View/Watchlist action buttons

35. **\[5.7\]** Implement watchlist add/remove logic

36. **\[5.8\]** Add X scouts viewed you to Player Dashboard

## **Sprint 6: Extended Coach Dashboard**

37. **\[6.1\]** Create player\_notes table

38. **\[6.2\]** Build Compare Tool component with radar chart

39. **\[6.3\]** Create /api/coach/compare endpoint

40. **\[6.4\]** Build Player Notes modal/sidebar

41. **\[6.5\]** Create /api/coach/notes endpoints (CRUD)

42. **\[6.6\]** Build Team Analytics card

43. **\[6.7\]** Add conditional rendering for simple vs extended dashboard

## **Sprint 7: PRO Features**

44. **\[7.1\]** Create talent\_alerts table

45. **\[7.2\]** Build advanced filters UI (score range, combined)

46. **\[7.3\]** Build Create Alert modal

47. **\[7.4\]** Create /api/alerts endpoints (CRUD)

48. **\[7.5\]** Build Contact button and modal

49. **\[7.6\]** Create /api/contact/send endpoint

50. **\[7.7\]** Add talent alert trigger job

51. **\[7.8\]** Build Export Reports feature (PDF/Excel)

## **Sprint 8: Polish**

52. **\[8.1\]** Add loading states to all new components

53. **\[8.2\]** Add error handling and error boundaries

54. **\[8.3\]** Test all subscription flows end-to-end

55. **\[8.4\]** Test limit enforcement edge cases

56. **\[8.5\]** Mobile responsiveness pass

57. **\[8.6\]** Add track switching with fee logic

# **13\. API Endpoints Summary**

## **Subscription**

| Method | Endpoint | Description |
| :---- | :---- | :---- |
| POST | /api/stripe/create-checkout | Create Stripe checkout session |
| POST | /api/stripe/webhook | Handle Stripe webhooks |
| GET | /api/subscription/status | Get current subscription |
| POST | /api/subscription/cancel | Cancel subscription |
| POST | /api/subscription/switch-track | Switch user track |

## **Usage Limits**

| Method | Endpoint | Description |
| :---- | :---- | :---- |
| GET | /api/limits/check | Get remaining limits for user |
| POST | /api/limits/consume | Decrement limit after analysis |

## **Global Ranking**

| Method | Endpoint | Description |
| :---- | :---- | :---- |
| GET | /api/ranking/position | Get user rank, percentile, benchmarks |
| GET | /api/ranking/leaderboard | Get leaderboard (shadow or full) |
| GET | /api/ranking/search | Search players with filters |

## **Watchlist**

| Method | Endpoint | Description |
| :---- | :---- | :---- |
| GET | /api/watchlist | Get scout watchlist |
| POST | /api/watchlist/add | Add player to watchlist |
| DELETE | /api/watchlist/:id | Remove from watchlist |

## **Coach Extended**

| Method | Endpoint | Description |
| :---- | :---- | :---- |
| GET | /api/coach/compare | Get comparison data for players |
| GET | /api/coach/analytics | Get team analytics |
| GET | /api/coach/notes/:playerId | Get notes for player |
| POST | /api/coach/notes | Create/update player note |
| DELETE | /api/coach/notes/:id | Delete note |

## **Alerts and Contact (PRO)**

| Method | Endpoint | Description |
| :---- | :---- | :---- |
| GET | /api/alerts | Get user alerts |
| POST | /api/alerts | Create talent alert |
| DELETE | /api/alerts/:id | Delete alert |
| POST | /api/contact/send | Send contact request to player |

# **14\. Critical Rules (Do Not Break)**

## **14.1 Data Separation**

* Players NEVER see other player profiles or real names

* Shadow leaderboard shows ONLY Player \#ID \+ Score

* Individual analyses do NOT affect Global Ranking

* Coach-uploaded analyses are PRIVATE

## **14.2 Subscription Boundaries**

* No feature overlap that allows cheaper tier to get expensive features

* $5 Premium gives ZERO access to player database

* $25 Basic cannot contact players or use advanced filters

* Individual track cannot access Player Dashboard

## **14.3 Limits**

* Always check limits BEFORE allowing upload

* Always consume limit AFTER successful analysis

* Show clear remaining count to users

* Unlimited means skip the check, not set to high number

* Admin bypasses all limit checks — do not consume or check limits if `is_admin = true`

## **14.4 Privacy**

* Players see X scouts viewed you (number only)

* Players do NOT see which scouts

* Scout notes are private to that scout

* Watchlist is private to that scout

*\--- End of Implementation Plan \---*