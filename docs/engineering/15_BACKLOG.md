# 15 — Backlog

## Feature Backlog

### Unblocked — Can Build Now

| Feature | Effort | Notes |
|---|---|---|
| Fund website/Twitter deep link | 2h | Replace `logAction()` with `window.open()` or Telegram WebApp.openLink |
| Remove `console.log` from production | 30m | Delete `logAction()`, replace with real handlers or no-op |
| Favorites page | 1 day | Store exists (`useFavoritesStore`); needs a page + UI |
| "Top Chains" section hide when empty | 1h | Already `[]`; just conditionally render section |

### Blocked by Backend / DB Work

| Feature | Blocked By | Effort |
|---|---|---|
| Lead investor on funding rounds | `funding_investors.is_lead` DB column | 1d DB + 1d frontend |
| Blockchain tag on project hero | `projects.chain` DB column + ingest | 2d DB + 1d frontend |
| Risk level on unlock card | Score or threshold system for unlock risk | 1d design + 2d backend |
| Fund activity status | Active/exited status on portfolio items | 2d DB + 1d frontend |
| Per-chain TVL breakdown | Chain-level TVL from DefiLlama | 2d backend |

### Blocked by Infrastructure

| Feature | Blocked By | Effort |
|---|---|---|
| Server-side watchlist sync | Auth system (need user identity) | 3d |
| Watchlist + Favorites cross-device sync | API endpoints + server storage | 1 week |
| Push notifications for unlocks | Notification infrastructure | 1 week |
| Real-time price updates | WebSocket or SSE endpoint | 3d |

### Blocked by Auth System (Not Started)

| Feature | Notes |
|---|---|
| User profile page | Need Telegram user identity |
| Personalized rankings | Need persistent user preferences |
| Social features (sharing, follow) | Need user graph |

## Future Architecture

- **Worker-based ingestion**: Move sync scripts to a Supabase Edge Function or background job (currently manual CLI)
- **Price streaming**: CoinGecko WebSocket → Supabase Realtime → Telegram Mini App
- **ML-based momentum scoring**: Replace heuristic momentum score with embedding-based similarity
