# Backend Overview — Smart Money Discovery Platform

Tài liệu này tóm tắt **toàn bộ phần backend đã xây dựng đến thời điểm hiện tại**: luồng dữ liệu chạy như thế nào, dữ liệu lấy từ đâu, Supabase đã làm gì, và công nghệ nào đang được dùng. Đây là bản chụp tình trạng thực tế của code, không phải kế hoạch — nếu có khác biệt với `SYSTEM_ARCHITECTURE.md`/`DEVELOPER_GUIDE.md` (hai file đó được viết từ giai đoạn đầu và chưa cập nhật), thì code + file này mới là sự thật hiện tại.

---

## 1. Luồng hoạt động tổng quát

Có **hai luồng độc lập**, chỉ gặp nhau tại Supabase (database):

```
NGUỒN DỮ LIỆU NGOÀI (ChainBroker, CoinGecko, DefiLlama)
        │  HTTP, retry, rate-limit, validate (zod)
        ▼
   Providers (src/providers/)
        │  Raw API response → NormalizedXxx (chuẩn hoá field)
        ▼
   Ingestion (src/ingestion/)
        │  Normalized → Draft → dedupe → upsert vào Supabase
        ▼
   Identity Resolution (src/identity/)
        │  match 1 project giữa nhiều provider khác nhau
        ▼
   Sync Jobs / CLI (src/sync/, src/cli/)
        │  điều phối: phân trang, retry theo job, ghi sync_runs
        ▼
┌─────────────────────────────────────────────┐
│              SUPABASE (Postgres)             │  ← điểm giao duy nhất
│  projects, funds, funding_rounds,            │
│  project_metrics, token_unlock_events,       │
│  project_scores, materialized views...       │
└─────────────────────────────────────────────┘
        ▲
        │  đọc dữ liệu thô, tính điểm
   Scoring Engine (src/scoring/)            — thuần logic, không I/O
        │
        ▼
   Scoring Sync (src/scoring-sync/)
        │  ghi project_scores, refresh materialized views
        ▼
   Dashboard Query Layer (src/dashboard/)
        │  nơi DUY NHẤT được join/aggregate dữ liệu cho frontend
        ▼
   REST API Layer (src/api/)
        │  chỉ gọi Dashboard Query Layer, KHÔNG bao giờ query Supabase trực tiếp
        ▼
   (Frontend — chưa xây)
```

Nguyên tắc xuyên suốt: **mỗi tầng chỉ được phụ thuộc vào tầng bên trái nó** (provider → ingestion → sync → cli) và **tầng đọc (scoring/dashboard/api) hoàn toàn tách biệt với tầng ghi (ingestion)** — ingestion không biết scoring tồn tại, scoring không biết provider nào sinh ra dữ liệu.

---

## 2. Dữ liệu lấy từ đâu

| Nguồn | Loại dữ liệu | Provider phụ trách |
|---|---|---|
| **ChainBroker** (API không chính thức) | Danh sách project, funds, funding rounds, token unlock events | `src/providers/chainbroker/` |
| **CoinGecko** | Giá, market cap, FDV, volume, % thay đổi giá, ATH/ATL | `src/providers/coingecko/` |
| **DefiLlama** | TVL, revenue, fees theo protocol/chain | `src/providers/defillama/` |

Cả 3 provider đều **không hề import Supabase** — chúng chỉ "nói thật" những gì API gốc trả về, dưới dạng kiểu `Normalized*` đã chuẩn hoá (ví dụ parse `"$25M"` → `25_000_000`).

Vì 3 nguồn này định danh cùng một project bằng ID khác nhau (slug ChainBroker, id CoinGecko, slug DefiLlama...), có một tầng riêng để gộp chúng lại:

- **`src/identity/`** — so khớp theo độ ưu tiên: contract address → provider ID → slug → symbol → tên → bảng alias (`project_aliases`, migration 005) → override thủ công. Khi khớp chắc chắn, tự động lưu vào `project_aliases` để lần sau khớp tức thì.

---

## 3. Các thành phần backend đã xây (theo tầng)

### 3.1 Provider layer — `src/providers/`
- `base/` — engine HTTP chung: retry + backoff, rate limiter, timeout, validate response (zod), structured logging. Mọi provider đều kế thừa từ đây, **không ai tự viết lại logic networking**.
- `chainbroker/`, `coingecko/`, `defillama/` — mỗi provider có `SOURCE.md` (khảo sát API thật), `types.ts`, `schemas.ts`, `errors.ts`, `client.ts`, `provider.ts`.

### 3.2 Identity Resolution — `src/identity/`
Map nhiều ID từ nhiều provider về **một** `project_id` nội bộ, có độ tin cậy (confidence score) và xử lý xung đột (1 provider trỏ tới 2 project, symbol trùng nhau, v.v.).

### 3.3 Ingestion layer — `src/ingestion/`
- `chainbroker/` — ghi projects, funds, funding rounds, unlock events vào Supabase (upsert thật nếu có unique constraint, find-or-create nếu chưa).
- `metrics/` — pipeline gộp dữ liệu CoinGecko + DefiLlama vào **một bảng chung** `project_metrics`, dùng Identity Resolution để biết ghi vào project nào. Có cơ chế tránh "ghi đè mất dữ liệu" khi 1 endpoint chỉ trả về 1 phần field (TVL-only không được phép null hoá revenue/fees đã có trước đó).

### 3.4 Sync / CLI — `src/sync/`, `src/cli/`
Điều phối **khi nào** và **bao nhiêu** chạy ingestion: phân trang, giới hạn trang cho môi trường dev, retry theo job, ghi log ra `sync_runs` (best-effort, không bao giờ làm fail job chính). Mỗi provider có CLI riêng (`chainbroker-sync.ts`, `metrics-sync.ts`, `scoring-sync.ts`) chạy qua `npm run sync:*`.

### 3.5 Scoring Engine — `src/scoring/` (thuần logic, KHÔNG đụng database)
Tính điểm 0-100 cho mỗi project theo 7 tiêu chí độc lập: funding, investor, market, tvl, revenue, unlock (an toàn unlock, không phải rủi ro), momentum → gộp lại bằng trọng số (`weighted-score.ts`) ra `overallScore` + `grade` (A+ → D) + giải thích bằng text.

### 3.6 Scoring Sync — `src/scoring-sync/`
Lấy dữ liệu thô từ Supabase → gọi Scoring Engine → ghi `project_scores` (chỉ ghi khi giá trị thay đổi — "read-before-write diff", tránh ghi rác) → refresh 4 materialized view tổng hợp.

### 3.7 Dashboard Query Layer — `src/dashboard/`
**Tầng DUY NHẤT** được phép join/aggregate dữ liệu để phục vụ frontend. Chỉ đọc, không bao giờ ghi. Gồm:
- `home.ts`: `getWeeklyPicks`, `getMonthlyPicks`, `getTopFunds`, `getNewFunding`, `getUnlockAlerts`
- `project.ts`: `getProjectOverview`, `getProjectFunding`, `getProjectMetrics`, `getProjectUnlocks`
- `fund.ts`: `getFundOverview`, `getFundPortfolio`
- `search.ts`: `searchProjects`, `searchFunds`

### 3.8 REST API Layer — `src/api/`
6 endpoint, mỗi handler **chỉ gọi Dashboard Query Layer**, không bao giờ query Supabase trực tiếp:

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/home` | Các mục trang chủ (weekly picks, top funds, funding mới, unlock alert) |
| GET | `/api/projects/:slug` | Chi tiết 1 project (overview + funding + metrics + unlocks) |
| GET | `/api/funds/:slug` | Chi tiết 1 fund (overview + portfolio, có phân trang) |
| GET | `/api/search` | Tìm kiếm project/fund |
| GET | `/api/rankings/weekly` | Bảng xếp hạng tuần |
| GET | `/api/rankings/monthly` | Bảng xếp hạng tháng |

Có thêm: response helper (envelope JSON chuẩn `{success, data, pagination?}`), error helper (`{success:false, error:{code,message}}`), pagination helper. **Chưa có**: authentication, caching, rate limiting, và chưa có server thật (chỉ là các hàm handler thuần, dùng `Request`/`Response` chuẩn Web — chưa gắn vào Express/Next/Fastify nào).

Tài liệu OpenAPI mô tả đầy đủ 6 endpoint này: `src/api/openapi.yaml`.

### 3.9 Test — `src/api/__tests__/`
Integration test cho cả 6 endpoint, dùng **Supabase giả** (mock), không test provider thật. Chạy bằng `node:test` (built-in của Node, không thêm dependency) qua `npm test`.

---

## 4. Supabase đã làm gì

### Migrations (đánh số tuần tự, không sửa lại số cũ)

| File | Nội dung chính |
|---|---|
| `001_initial_schema.sql` | Bảng gốc: `projects`, `funds`, `funding_rounds`, `funding_investors`, `weekly_rankings`, `monthly_rankings`, RLS pattern chuẩn (`is_admin()` + public-read/admin-write) |
| `002_future_integrations.sql` | Chuẩn bị cho provider tương lai: `data_sources`, `project_external_ids`, `social_metrics`, `token_unlock_events`, `smart_money_wallets`, `smart_money_flows` |
| `003_leaderboard_optimizations.sql` | View `fund_leaderboard` + index |
| `004_sync_metadata.sql` | Bảng `sync_runs` — log best-effort cho mỗi lần sync (provider-agnostic) |
| `005_project_identity.sql` | Bảng `project_aliases` cho tầng Identity Resolution |
| `006_project_metrics_extension.sql` | Mở rộng `project_metrics` thêm 13 cột (market cap rank, supply, price change, TVL change, revenue, fees...) |
| `007_scoring_engine_extension.sql` | Thêm `investor_score`, `revenue_score`, `momentum_score` vào `project_scores` |
| `008_scoring_materialized_views.sql` | 4 materialized view: `weekly_rankings_mv`, `monthly_rankings_mv`, `top_funds`, `top_projects` |
| `009_scoring_refresh_function.sql` | RPC `refresh_materialized_view(view_name)` — vì PostgREST không cho chạy `REFRESH MATERIALIZED VIEW` trực tiếp |
| `010_funds_slug.sql` | Thêm cột `slug` (unique, có index) cho bảng `funds`, backfill từ `name` |

### Cơ chế đặc biệt trong Supabase
- **RLS**: bảng nội dung công khai (`projects`, `funds`...) dùng pattern public-read/admin-write; bảng metadata nội bộ (`sync_runs`) chỉ cho `service_role`, không có policy công khai.
- **Materialized views** không hỗ trợ RLS → dùng `grant select to anon, authenticated` trực tiếp.
- **Refresh materialized view** phải qua RPC `security definer` vì PostgREST không có cách chạy SQL thô.
- **Upsert strategy**: bảng có unique constraint thật (`projects.slug`, `funds.slug`, `funds.name`) → upsert thật; bảng chưa có (`funding_rounds`, `token_unlock_events`) → find-or-create (select trước, insert nếu chưa có).

### `types/database.types.ts`
File TypeScript viết tay, mirror chính xác từng migration (vì project chưa link với Supabase CLI để generate tự động). Mỗi lần thêm migration đều phải sửa file này cùng lúc.

---

## 5. Công nghệ đang dùng

| Thành phần | Công nghệ |
|---|---|
| Ngôn ngữ | TypeScript (strict mode), chạy qua `tsx` (không cần build) |
| Database | Supabase (Postgres) — qua `@supabase/supabase-js` |
| Validate dữ liệu ngoài | `zod` (validate response của từng provider, không strict để chịu được field mới) |
| HTTP client | Tự viết (`src/providers/base/`) — không dùng axios/fetch-wrapper ngoài |
| API layer | Không dùng framework (không Express/Next/Fastify) — handler thuần theo chuẩn Web `Request`/`Response` (có sẵn trong Node 18+, khai báo qua `tsconfig.json` `lib: ["ES2022","DOM"]`) |
| Test | `node:test` + `node:assert` (built-in Node, không thêm dependency) |
| CLI | Script Node thuần qua `tsx`, không dùng thư viện CLI framework |
| Package manager | npm |

**Không có**: framework backend (Express/Fastify/Next.js), ORM (Prisma/Drizzle — dùng trực tiếp `@supabase/supabase-js`), Redis/cache layer, message queue, Docker.

---

## 6. Đã làm tới bước nào / còn thiếu gì

**Đã hoàn thành và có typecheck/test xanh:**
1. ✅ Provider base layer + 3 provider (ChainBroker, CoinGecko, DefiLlama)
2. ✅ Identity Resolution layer
3. ✅ Ingestion pipeline (ChainBroker + metrics CoinGecko/DefiLlama)
4. ✅ Sync jobs + CLI + bootstrap orchestration
5. ✅ Scoring Engine (thuần logic, đầy đủ 7 tiêu chí)
6. ✅ Scoring Sync pipeline (ghi `project_scores`, refresh materialized views)
7. ✅ Dashboard Query Layer (đầy đủ home/project/fund/search, gồm cả monthly rankings)
8. ✅ REST API layer (6 endpoint, có pagination/error/response helper, có OpenAPI doc)
9. ✅ Integration test cho API layer (mock Supabase)

**Chưa làm (cố ý, theo đúng phạm vi từng task):**
- ❌ Authentication / phân quyền API
- ❌ Caching, rate limiting
- ❌ Server thật để chạy các API handler (chưa có ai gọi `handleGetHome` qua HTTP thật — mới có hàm, chưa có cổng/router)
- ❌ Frontend / UI
- ❌ AI Summary, Notification Service (mới là ý tưởng trong `SYSTEM_ARCHITECTURE.md`, chưa code)
- ❌ Provider RootData, CryptoRank, Kaito (đã có sẵn extension point nhưng chưa implement)

**Vài điểm cần lưu ý (gap đã biết, không phải bug):**
- `funding_investors.is_lead` chưa có cột riêng (gộp chung lead + backer thường).
- Phân trang ở API layer là phân trang "trong bộ nhớ" trên kết quả Dashboard Query Layer đã trả về (vì các hàm dashboard chỉ nhận `limit`, không có offset/count thật) — với endpoint rankings, `totalItems` chỉ phản ánh "cửa sổ" đã fetch, không phải tổng số dòng thật trong database.
- `SYSTEM_ARCHITECTURE.md`/`DEVELOPER_GUIDE.md` viết từ giai đoạn đầu, còn ghi "Scoring Engine: Planned" — đã lỗi thời so với code thực tế, nên ưu tiên đọc code + file này hơn.
