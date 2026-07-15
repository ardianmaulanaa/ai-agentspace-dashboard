# AI AgentSpace Dashboard

AI AgentSpace Dashboard adalah aplikasi backend + dashboard portfolio untuk mengelola workspace AI, channel diskusi, forum review, riwayat pesan, dan eksekusi multi-agent melalui OpenClaw.

Project ini disesuaikan dengan rubrik Backend Study Group: autentikasi, RBAC, relasi database, validasi request, struktur API modular, dokumentasi OpenAPI, dan fitur bonus seperti upload attachment, search/filter di UI, serta rate limiting login.

## Screenshot

### Login

<img src="docs/screenshots/login.png" alt="Halaman login AI AgentSpace Dashboard" width="900" />

### Dashboard

<img src="docs/screenshots/dashboard.png" alt="Halaman dashboard AI AgentSpace" width="900" />

## Topik

Topik bebas: **AI Workspace & Agent Management Dashboard**.

Fokus sistem:

- Mengelola workspace AI.
- Mengelola category dan channel mirip Discord.
- Menyimpan pesan user dan balasan agent.
- Membuat forum post dan reply untuk review ide.
- Memanggil AI agent seperti MASBRE, MASBRO, MASSEH, GPT, Claude, Gemini, Qwen, DeepSeek, dan Grok melalui OpenClaw.
- Menampilkan status konfigurasi Supabase, provider AI, dan agent bridge.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase
- OpenClaw CLI agent bridge
- Server Route Handlers sebagai REST API
- Custom validation helper
- HTTP-only cookies untuk auth session

## Cara Menjalankan

```bash
npm install
npm run dev
```

Local app:

```text
http://localhost:3000
```

OpenAPI JSON:

```text
http://localhost:3000/api/docs/openapi
```

## Environment

Gunakan file `.env` di root project. File ini tidak ikut dikomit karena masuk `.gitignore`.

Auth utama memakai Supabase Authentication Users. Env dashboard di bawah ini hanya fallback admin lokal dan token cookie dashboard.

```env
DASHBOARD_USERNAME=ardian
DASHBOARD_DISPLAY_NAME=Ardian
DASHBOARD_ROLE=admin
DASHBOARD_JWT_SECRET=
DASHBOARD_PASSWORD_HASH=
DASHBOARD_PASSWORD=
LOGIN_RATE_LIMIT_MAX_ATTEMPTS=5
LOGIN_RATE_LIMIT_WINDOW_SECONDS=60
```

`DASHBOARD_PASSWORD_HASH` direkomendasikan untuk demo penilaian. Format utama yang didukung adalah bcrypt:

```text
$2b$12$...
```

Format legacy `scrypt$salt$hexhash` masih bisa dibaca supaya setup lama tidak rusak.

Untuk membuat hash bcrypt cepat:

```bash
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('password-demo', 12))"
```

`DASHBOARD_PASSWORD` tetap tersedia sebagai fallback lokal.

Login memakai rate limiting in-memory per kombinasi IP dan email. Defaultnya maksimal 5 percobaan gagal dalam 60 detik, lalu API membalas `429` dengan header `Retry-After`.

Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_USER_STORE=supabase-auth
```

Schema database untuk demo ada di:

```text
supabase/schema.sql
```

OpenClaw:

```env
OPENCLAW_CLI_PATH=openclaw
OPENCLAW_PROFILE=masbre
OPENCLAW_AGENT_ID=main
OPENCLAW_SESSION_KEY=agent:main:dashboard
OPENCLAW_AGENT_RESPONSE_MODE=cli
```

`OPENCLAW_AGENT_RESPONSE_MODE=cli` membuat chat diproses normal lewat OpenClaw CLI. Ubah ke `fast` hanya kalau ingin fallback lokal untuk demo cepat.

## Fitur Sesuai Rubrik

## Checklist Penilaian

Autentikasi & Keamanan (25%):

- Auth JWT/session: access token dan refresh token HTTP-only cookie.
- Keamanan password: Supabase Auth untuk user utama, bcrypt 12 rounds untuk fallback admin lokal.
- RBAC: role `admin`, `owner`, `member` dari `user_metadata.role`; admin route memakai authorization helper.
- Keamanan ekstra: login rate limiting per IP/email dengan status `429` dan header `Retry-After`.

Kelengkapan & Logika Bisnis (30%):

- Relasi DB: `workspaces`, `workspace_members`, `categories`, `channels`, `messages`, `forum_posts`, `forum_replies`.
- Fitur utama: auth, dashboard data, category/channel, workspace member management, message, forum, agent invoke, admin user role, cleanup.
- Validasi: helper payload JSON, required string, enum, attachment type/size/data URL, email, password strength.

Kualitas & Struktur Kode (20%):

- Arsitektur: route handler modular di `src/app/api`, shared helper di `src/lib`, route middleware di `src/proxy.ts`.
- Error handling: status `400`, `401`, `403`, `404`, `409`, `429`, `500`, `502` sesuai kasus.
- Keterbacaan: type dan helper dipisah, nama fungsi sesuai tanggung jawab.

Dokumentasi & Pengujian (15%):

- OpenAPI tersedia di `GET /api/docs/openapi`.
- Postman Collection tersedia di `docs/postman-collection.json`.
- Demo flow tersedia di bagian "Cara Demo".

Bonus:

- Attachment image data URL pada message dengan validasi mime, base64, dan ukuran.
- Pagination, search, filtering di `GET /api/messages`.
- Rate limiting login bisa diatur melalui `LOGIN_RATE_LIMIT_MAX_ATTEMPTS` dan `LOGIN_RATE_LIMIT_WINDOW_SECONDS`.

### 1. Autentikasi & Keamanan

Status: lengkap untuk kebutuhan rubrik.

- Login memakai email Supabase Auth dan password. Fallback admin lokal masih tersedia untuk demo.
- Register member baru melalui halaman `/register` dan Supabase Authentication Users.
- Access token dan refresh token berbentuk JWT signed HMAC, disimpan di HTTP-only cookie.
- Password utama dikelola oleh Supabase Auth. Fallback password admin mendukung bcrypt (`bcryptjs`, 12 salt rounds) dan legacy scrypt.
- Password user hasil register dikelola oleh Supabase Auth, bukan file lokal.
- Register mewajibkan password minimal 8 karakter dan mengandung huruf serta angka.
- Session memakai HTTP-only JWT access cookie dan JWT refresh cookie.
- Endpoint refresh tersedia di `POST /api/auth/refresh`.
- Logout menghapus semua cookie auth.
- Login memiliki in-memory rate limiting per IP/email untuk mengurangi brute force.
- Role admin/owner/member disimpan di Supabase Auth `user_metadata.role`.
- Route privat dashboard dilindungi `src/proxy.ts`; endpoint API privat dilindungi helper auth di route handler.
- Admin bisa melihat user dan mengubah role melalui endpoint `/api/admin/users` dan panel Config.
- Endpoint admin cleanup dibatasi untuk role `admin`.

Workspace membership:

- Workspace member management tersedia melalui `GET`, `POST`, dan `DELETE /api/workspace-members`.

### 2. Kelengkapan & Logika Bisnis

Status: lengkap untuk MVP.

Entity utama:

- Supabase `auth.users`
- `workspace_members` (M-to-M antara auth user dan workspace)
- `workspaces`
- `categories`
- `channels`
- `messages`
- `forum_posts`
- `forum_replies`

Logika bisnis:

- Dashboard mengambil workspace, category, channel, messages, forum post, dan replies dari Supabase.
- User bisa membuat category.
- User bisa membuat channel bertipe `text`, `forum`, atau `voice`.
- Admin/owner bisa list, tambah/update, dan hapus member workspace.
- User bisa membuat pesan dengan attachment image data URL tervalidasi.
- User bisa list message dengan `page`, `limit`, `search`, dan `senderType`.
- User bisa edit, pin, react, dan delete message.
- User bisa membuat forum post dan reply.
- User bisa invoke agent dan balasannya disimpan ke Supabase.

Endpoint workspace member management tersedia untuk menutup relasi M-to-M `workspace_members`.

### 3. Validasi Request

Status: lengkap untuk endpoint inti.

Route-route create/update sekarang memakai helper `src/lib/validation.ts` untuk:

- Memastikan body adalah JSON object.
- Memastikan field wajib tidak kosong.
- Membatasi enum channel type.
- Membatasi attachment ke image data URL base64.
- Membatasi attachment ke PNG, JPEG, WebP, GIF.
- Membatasi ukuran attachment maksimal 2 MB.
- Membatasi register password minimal 8 karakter serta harus berisi huruf dan angka.
- Mengembalikan HTTP 400 untuk bad request.

### 4. Struktur Kode

Status: sesuai Next.js App Router.

Struktur penting:

```text
src/app/api/
  admin/cleanup
  agents/invoke
  auth/login
  auth/logout
  auth/me
  auth/refresh
  categories
  channels
  workspace-members
  config/status
  dashboard/data
  docs/openapi
  forum-posts
  messages

src/lib/
  auth.ts
  env.ts
  supabase.ts
  supabase-records.ts
  validation.ts

src/proxy.ts
  route middleware untuk halaman privat
```

Catatan: karena ini Next.js, struktur tidak memakai `controllers/routes/middlewares` Express, tetapi pemisahan tanggung jawabnya tetap ada melalui route handlers dan `src/lib`.

### 5. Error Handling

Status: sudah ada di route handler dan helper response.

Contoh status code:

- `400` untuk request tidak valid.
- `401` untuk belum login.
- `403` untuk role tidak cukup.
- `404` untuk resource tidak ditemukan.
- `429` untuk login terlalu sering.
- `500` untuk config/database error.
- `502` untuk gagal invoke OpenClaw agent.

### 6. Dokumentasi API

Status: lengkap.

OpenAPI JSON tersedia di:

```text
GET /api/docs/openapi
```

Endpoint ini mendokumentasikan auth, dashboard data, category, channel, workspace members, message, forum, agent invoke, dan admin cleanup.

Postman Collection tersedia di:

```text
docs/postman-collection.json
```

### 7. Bonus

Status: ada beberapa.

- File upload ringan melalui image attachment data URL pada message, dengan validasi mime/base64/ukuran.
- Pagination, search, dan filtering tersedia pada `GET /api/messages`.
- Search/filter juga tersedia di UI dashboard.
- Login rate limiting tersedia dengan konfigurasi env dan response `429`.
- Multi-agent bridge tersedia.
- Admin cleanup dry-run tersedia.

## Endpoint Utama

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Dashboard:

- `GET /api/dashboard/data`
- `GET /api/config/status`

Workspace:

- `POST /api/categories`
- `POST /api/channels`
- `GET /api/workspace-members`
- `POST /api/workspace-members`
- `DELETE /api/workspace-members`

Messages:

- `GET /api/messages`
- `POST /api/messages`
- `PATCH /api/messages/:id`
- `DELETE /api/messages/:id`

Forum:

- `POST /api/forum-posts`
- `POST /api/forum-posts/:id/replies`

Agent:

- `POST /api/agents/invoke`

Admin:

- `GET /api/admin/users`
- `PATCH /api/admin/users`
- `POST /api/admin/cleanup`

Docs:

- `GET /api/docs/openapi`

## Demo Flow

1. Login sebagai admin.
2. Atau buka `/register` untuk membuat akun member.
3. Buka dashboard.
4. Cek config status.
5. Load user list di panel Config, lalu ubah role member/owner/admin sebagai admin.
6. Buat category baru.
7. Buat channel baru.
8. Kirim message dengan atau tanpa attachment.
9. Edit/pin/react message.
10. Buat forum post.
11. Tambah reply forum.
12. Invoke agent MASBRE/MASBRO/MASSEH.
13. Lihat balasan agent tersimpan di message history.
14. Buka `/api/docs/openapi` untuk dokumentasi API.

## Pengujian

Jalankan validasi kode dan production build:

```bash
npm run test
```

Script ini menjalankan `npm run lint` dan `npm run build`.

## Yang Masih Bisa Ditingkatkan

- Tambah migration SQL Supabase di repo.
- Tambah Swagger UI dari OpenAPI JSON.
- Tambah automated API test.
