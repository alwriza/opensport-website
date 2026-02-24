**OpenSport Platform v2.0**

Technical Documentation for Fullstack Development

*Version 2.0 | February 2026*

# **1\. Platform Overview**

OpenSport is an AI-powered football analysis platform targeting the grassroots market. The platform analyzes player technique from smartphone videos, serving players seeking skill improvement (B2C freemium) and coaches/scouts (B2B subscriptions).

## **1.1 User Types**

| Type | Description | Track |
| :---- | :---- | :---- |
| Player | Football players wanting to improve technique | Player Track |
| Individual | Coaches and scouts (combined role) | Individual Track |

## **1.2 Core Principle**

One account \= One role \= One subscription. The user chooses the track at registration. Switching requires subscription cancellation.

# **2\. Subscription Tiers**

## **2.1 Player Track**

| Feature | FREE ($0) | PREMIUM ($5/mo) |
| :---- | :---- | :---- |
| Kick Analysis | 5/day | Unlimited |
| Match Moment (up to 2 min) | 1/week | 5/week |
| Full Player Match Analysis | 2/month | 4/month |
| History | 30 days video, 90 days text | 90 days video, 180 days text |
| Export PDF | No | Yes |
| Ads | Yes | No |
| Pro Badge (visible to scouts) | No | Yes |
| X scouts saved you (number) | No | Yes |

## **2.2 Individual Track**

| Feature | BASIC ($25/mo) | PRO ($75/mo) |
| :---- | :---- | :---- |
| View player profiles (real names) | Yes | Yes |
| Basic filters (age, position, city) | Yes | Yes |
| Advanced filters (by metrics) | No | Yes |
| Watchlist | 20 players | Unlimited |
| Compare players | 3 players | Unlimited |
| Player Match Analysis | 10/month | 50/month |
| Team Match Analysis | 4/month | 10/month |
| Talent Alerts | No | Yes |
| Contact Button | No | Yes |
| Export reports | Basic PDF | Full PDF \+ Excel |

# **3\. Pages and Access Matrix**

## **3.1 Navigation Structure**

All pages visible in navbar for all users. Access restricted by subscription. Restricted pages show blurred preview with upgrade CTA.

| Page | URL | Access |
| :---- | :---- | :---- |
| Main Page | / | All users |
| Player Dashboard | /player-dashboard | Player track only |
| Coach Dashboard | /coach-dashboard | All (simple for Players, extended for Individual) |
| Training | /training | All users (no restrictions) |
| Global Ranking | /ranking | All (different content by subscription) |
| Pricing | /pricing | All users |

## **3.2 Registration Flow**

* User signs up via Clerk (email/Google)

* Modal appears: Choose your role \- Player or Individual

* Player selection: Redirect to /player-dashboard (free tier active)

* Individual selection: Redirect to /pricing (must purchase BASIC or PRO)

# **4\. Page Specifications**

## **4.1 Player Dashboard (/player-dashboard)**

**Primary interface for players to upload videos, view analysis results, and track progress.**

### **Components:**

* Profile sidebar: XP, level, streaks, team list

* Latest analysis card: Video player \+ scores (stability, power, technique, balance, overall)

* Video history list: Past analyses with View Results button

* Upload button: Opens Upload Modal

* Limits display: Shows remaining analyses for current period

### **Modals:**

* Upload Modal: Video upload with camera angle selection

* Results Modal: Detailed breakdown when viewing past analysis

* Team Profile Overlay: When clicking on team in sidebar

### **Limit enforcement:**

* Check limits before upload (kick/moment/match)

* Show upgrade prompt when limit reached

* Display remaining count in UI

## **4.2 Coach Dashboard (/coach-dashboard)**

**Team management and player analysis interface. Two versions based on subscription.**

### **Simple Version (Player FREE/PREMIUM):**

* Team roster table with player list

* View Results button per player (opens Player Profile Overlay)

* Invite players via Invite Code

* Basic team statistics

* Team Match Analysis: 1 per 2 weeks

### **Extended Version (Individual BASIC/PRO):**

* Everything from simple version, plus:

  * Compare Tool: Side-by-side player comparison with radar chart

  * Tactical Heatmaps: Team/player position maps from match analysis

  * Detailed team analytics: Averages, strengths, weaknesses

  * Private notes per player

  * Increased limits: 10-50 player matches, 4-10 team matches per month

  * Export team reports (PDF/Excel for PRO)

## **4.3 Global Ranking (/ranking)**

**Leaderboard showing player rankings. Content varies dramatically by subscription.**

### **Shadow Mode (Player FREE/PREMIUM):**

* Your Position card: Rank number, percentile, weekly change

* Benchmarks: Top 1%/10%/25%/Average scores, your score comparison

* Shadow Leaderboard: Shows Player \#ID \+ Score only (no real names)

* FREE: See 5 positions above/below you

* PREMIUM: See 20 positions above/below you

* Upgrade CTA: Teaser for Individual plans

Critical: No identifying information. Player \#8492 is meaningless hash. Prevents scout exploitation.

### **Full Mode (Individual BASIC/PRO):**

* Full table with real names, photos, age, position, location, score

* Filters: Position, Age (U15-U21+), Country, City

* BASIC: Basic filters only

* PRO: Advanced filters (score \> X, combined criteria)

* Actions per player: View profile, Add to Watchlist

* PRO only: Contact button, Talent Alerts setup

## **4.4 Training (/training)**

**Exercise library and skill development. Fully accessible to all users.**

* Skill Tree: Visual progression of football skills

* Exercise Library: Video tutorials organized by skill

* AI Recommendations: Personalized based on analysis results

* Video Modal: Opens when selecting skill level or exercise

No subscription restrictions on this page.

## **4.5 Pricing (/pricing)**

**Subscription selection and payment.**

* Player section: FREE (current) and PREMIUM ($5/mo) comparison

* Individual section: BASIC ($25/mo) and PRO ($75/mo) comparison

* Stripe integration for payments

* Current plan indicator for logged-in users

* Upgrade/downgrade flows

# **5\. Data Flows and Business Logic**

## **5.1 Analysis Types**

| Type | Duration | Who uploads | Affects Ranking | Visible to Scouts |
| :---- | :---- | :---- | :---- | :---- |
| Kick Analysis | 3-10 sec | Player | Yes | Yes (public) |
| Match Moment | Up to 2 min | Player | Yes | Yes (public) |
| Full Player Match | Up to 60 min | Player or Coach | Player upload only | Player upload only |
| Team Match | Up to 60 min | Coach only | No | No (private) |

## **5.2 Visibility Rules**

* Player uploads: Public \- visible to all scouts, affects Global Ranking

* Coach uploads player match: Private \- only coach sees unless player in their team

* Coach uploads team match: Private \- only coach sees, players see their portion

* Individual analyses do NOT affect Global Ranking (prevents scout pollution)

## **5.3 Track Switching Protection**

* First switch from Player to Individual: FREE

* Subsequent switches: PAID ($10 fee)

* Prevents scouts gaming system by registering as players

* Setting available in user profile/settings

## **5.4 Scout Visibility Notification**

* When scout adds player to Watchlist: Player notified

* Player profile shows: X scouts have viewed/saved you

* Motivates players to improve, validates platform value

# **6\. Database Schema Updates**

Required additions to existing Supabase schema:

## **6.1 Users Table Additions**

* user\_track: enum(player, individual)

* subscription\_tier: enum(free, premium, basic, pro)

* track\_switches: integer (count of track changes)

* stripe\_customer\_id: string

* subscription\_status: enum(active, cancelled, past\_due)

* is\_admin: boolean (default: false)

## **6.2 New Tables**

* usage\_limits: user\_id, period\_start, kicks\_used, moments\_used, matches\_used

* watchlist: scout\_id, player\_id, added\_at, notes

* talent\_alerts: user\_id, filters\_json, created\_at, last\_triggered

* scout\_views: scout\_id, player\_id, viewed\_at (for X scouts viewed you)

* player\_notes: coach\_id, player\_id, note\_text, tags, created\_at

## **6.3 RLS Policies**

* Players can only see own analyses and public team data

* Scouts can see all player profiles if subscription active

* Coach-uploaded analyses visible only to uploader

* Watchlist/notes private to owner

# **7\. API Endpoints**

## **7.1 Subscription Management**

* POST /api/subscription/create-checkout \- Create Stripe checkout session

* POST /api/subscription/webhook \- Handle Stripe webhooks

* GET /api/subscription/status \- Get current subscription status

* POST /api/subscription/cancel \- Cancel subscription

* POST /api/subscription/switch-track \- Switch user track (with fee logic)

## **7.2 Usage Limits**

* GET /api/limits/check \- Check remaining limits for user

* POST /api/limits/consume \- Decrement limit after analysis

* Cron job: Reset weekly/monthly limits

## **7.3 Global Ranking**

* GET /api/ranking/position \- Get user position and benchmarks

* GET /api/ranking/leaderboard \- Get leaderboard (shadow or full based on subscription)

* GET /api/ranking/search \- Search players with filters (Individual only)

## **7.4 Watchlist and Alerts**

* GET /api/watchlist \- Get scout watchlist

* POST /api/watchlist/add \- Add player to watchlist

* DELETE /api/watchlist/remove \- Remove from watchlist

* POST /api/alerts/create \- Create talent alert

* GET /api/alerts/matches \- Get players matching alert criteria

## **7.5 Coach Dashboard Extended**

* GET /api/coach/compare \- Get comparison data for players

* GET /api/coach/heatmap \- Get tactical heatmap data

* POST /api/coach/notes \- Save player notes

* GET /api/coach/analytics \- Get team analytics

# **8\. Middleware and Access Control**

## **8.1 Route Protection**

* middleware.ts: Check user track and subscription for protected routes

* /player-dashboard: Require player track

* /coach-dashboard: Allow all, but filter content by subscription

* /ranking: Allow all, but filter content by subscription

## **8.2 Feature Flags**

* Create useSubscription hook returning current tier and permissions

* Create FeatureGate component for conditional rendering

* Create UpgradePrompt component for limit-reached scenarios

## **8.3 Subscription Check Logic**

const permissions \= { canViewProfiles: \[basic, pro\], canUseAdvancedFilters: \[pro\], canContact: \[pro\], canExport: \[premium, basic, pro\] }

если `is_admin = true`, возвращать `tier: pro` и все абсолютно  permissions, игнорируя реальный subscription status и usage limits.

if (is\_admin) return { tier: 'pro', track: 'individual', all permissions: true }

# **9\. Implementation Roadmap**

## **Phase 1: Infrastructure**

* 1.1 Database schema updates (new tables, RLS)

* 1.2 Stripe integration setup

* 1.3 Registration flow with track selection modal

* 1.4 Pricing page with Stripe checkout

* 1.5 Subscription webhook handlers

* 1.6 useSubscription hook and FeatureGate component

## **Phase 2: Player Features**

* 2.1 Usage limits system (check/consume/reset)

* 2.2 Limits display in Player Dashboard

* 2.3 Upgrade prompts when limits reached

* 2.4 Player Premium badge visibility

## **Phase 3: Global Ranking**

* 3.1 Ranking calculation logic (scores aggregation)

* 3.2 Shadow Leaderboard for Players

* 3.3 Full Leaderboard for Individual

* 3.4 Filters and search (basic and advanced)

* 3.5 Watchlist functionality

* 3.6 Scout view notifications to players

## **Phase 4: Extended Coach Dashboard**

* 4.1 Compare Tool UI with radar charts

* 4.2 Tactical heatmaps integration

* 4.3 Team analytics dashboard

* 4.4 Private notes system

* 4.5 Export reports (PDF/Excel)

## **Phase 5: Individual Pro Features**

* 5.1 Advanced filters in Global Ranking

* 5.2 Talent Alerts system

* 5.3 Contact button and messaging

* 5.4 Increased limits enforcement

## **Phase 6: Polish**

* 6.1 Track switching with fee logic

* 6.2 Notification system for watchlist/alerts

* 6.3 Analytics for scouts viewed you

* 6.4 Mobile responsiveness pass

* 6.5 Error handling and edge cases

# **10\. Recommended File Structure**

Additions to existing project structure:

## **10.1 New Components**

* components/subscription/PricingCard.tsx

* components/subscription/FeatureGate.tsx

* components/subscription/UpgradePrompt.tsx

* components/subscription/LimitDisplay.tsx

* components/ranking/ShadowLeaderboard.tsx

* components/ranking/FullLeaderboard.tsx

* components/ranking/PlayerFilters.tsx

* components/ranking/WatchlistButton.tsx

* components/coach/CompareTool.tsx

* components/coach/HeatmapView.tsx

* components/coach/PlayerNotes.tsx

* components/coach/TeamAnalytics.tsx

* components/modals/TrackSelectionModal.tsx

## **10.2 New Hooks**

* hooks/useSubscription.ts \- Returns tier, permissions, limits

* hooks/useLimits.ts \- Usage limit checking

* hooks/useWatchlist.ts \- Watchlist operations

* hooks/useRanking.ts \- Ranking data fetching

## **10.3 API Routes**

* app/api/subscription/\* \- Stripe integration

* app/api/limits/\* \- Usage tracking

* app/api/ranking/\* \- Leaderboard endpoints

* app/api/watchlist/\* \- Scout features

* app/api/coach/\* \- Extended dashboard

## **10.4 Types**

* types/subscription.ts \- Tier enums, permissions interface

* types/ranking.ts \- Leaderboard item, filters

* types/watchlist.ts \- Watchlist entry, alert config

# **11\. Critical Business Rules**

## **11.1 Anti-Exploitation**

* Shadow mode shows ONLY Player \#ID \+ Score \- no identifying info

* Premium players still cannot see other profiles

* Individual analyses never affect Global Ranking

* Track switching has cost after first free switch

## **11.2 Data Privacy**

* Coach-uploaded analyses are private by default

* Players must opt-in to profile visibility (default: visible)

* Under-18 players: Extra privacy considerations

* GDPR compliance for EU users


## **11.3 Admin Rule:** 

"Admin — это аккаунт с флагом `is_admin = true`. Полностью обходит проверку подписки и usage limits. Видит только свои данные. Только для внутреннего использования."

## **11.4 Feature Boundaries**

Never allow feature overlap that undermines pricing:

* Player tiers: Access to OWN data only, never others

* Individual tiers: Access to OTHERS data, the only way to search

* Training page: Always free (acquisition tool)

* Global Ranking: Teaser for Players, full access for Individual

*\--- End of Documentation \---*