# AI AgentSpace Dashboard

AI AgentSpace Dashboard adalah aplikasi backend + dashboard portfolio untuk mengelola workspace AI, channel diskusi, forum review, riwayat pesan, dan eksekusi multi-agent melalui OpenClaw.

Project ini disesuaikan dengan rubrik Backend Study Group: autentikasi, RBAC, relasi database, validasi request, struktur API modular, dokumentasi OpenAPI, dan fitur bonus seperti upload attachment, search/filter di UI, serta rate limiting login.

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
DASHBOARD_PASSWORD_HASH=
DASHBOARD_PASSWORD=
DASHBOARD_ACCESS_TOKEN=
DASHBOARD_REFRESH_TOKEN=
```

`DASHBOARD_PASSWORD_HASH` direkomendasikan untuk demo penilaian. Format yang didukung:

```text
scrypt$salt$hexhash
```

`DASHBOARD_PASSWORD` tetap tersedia sebagai fallback lokal.

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
```

## Fitur Sesuai Rubrik

### 1. Autentikasi & Keamanan

Status: sebagian besar sudah ada.

- Login memakai email Supabase Auth dan password. Fallback admin lokal masih tersedia untuk demo.
- Register member baru melalui halaman `/register` dan Supabase Authentication Users.
- Fallback password admin mendukung hash scrypt.
- Password user hasil register dikelola oleh Supabase Auth, bukan file lokal.
- Session memakai HTTP-only access cookie dan refresh cookie.
- Endpoint refresh tersedia di `POST /api/auth/refresh`.
- Logout menghapus semua cookie auth.
- Login memiliki in-memory rate limiting untuk mengurangi brute force.
- Role tersedia lewat `DASHBOARD_ROLE`.
- Endpoint admin cleanup dibatasi untuk role `admin`.

Yang belum dibuat penuh:

- JWT signed token belum dipakai. Implementasi sekarang memakai server-side opaque token dari env.
- Multi-user database belum ada; user dashboard masih single-user dari env.

### 2. Kelengkapan & Logika Bisnis

Status: sudah ada untuk MVP.

Entity utama:

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
- User bisa membuat pesan dengan attachment image data URL.
- User bisa edit, pin, react, dan delete message.
- User bisa membuat forum post dan reply.
- User bisa invoke agent dan balasannya disimpan ke Supabase.

Yang belum dibuat penuh:

- Workspace member management belum menjadi endpoint terpisah.

### 3. Validasi Request

Status: sudah dirapikan.

Route-route create/update sekarang memakai helper `src/lib/validation.ts` untuk:

- Memastikan body adalah JSON object.
- Memastikan field wajib tidak kosong.
- Membatasi enum channel type.
- Membatasi attachment ke image data URL.
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
```

Catatan: karena ini Next.js, struktur tidak memakai `controllers/routes/middlewares` Express, tetapi pemisahan tanggung jawabnya tetap ada melalui route handlers dan `src/lib`.

### 5. Error Handling

Status: sudah ada di route handler.

Contoh status code:

- `400` untuk request tidak valid.
- `401` untuk belum login.
- `403` untuk role tidak cukup.
- `404` untuk resource tidak ditemukan.
- `429` untuk login terlalu sering.
- `500` untuk config/database error.
- `502` untuk gagal invoke OpenClaw agent.

### 6. Dokumentasi API

Status: sudah ada.

OpenAPI JSON tersedia di:

```text
GET /api/docs/openapi
```

Endpoint ini mendokumentasikan auth, dashboard data, category, channel, message, forum, agent invoke, dan admin cleanup.

### 7. Bonus

Status: ada beberapa.

- File upload ringan melalui image attachment data URL pada message.
- Search/filter tersedia di UI dashboard.
- Login rate limiting tersedia.
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

- `POST /api/admin/cleanup`

Docs:

- `GET /api/docs/openapi`

## Demo Flow

1. Login sebagai admin.
2. Atau buka `/register` untuk membuat akun member.
3. Buka dashboard.
4. Cek config status.
5. Buat category baru.
6. Buat channel baru.
7. Kirim message dengan atau tanpa attachment.
8. Edit/pin/react message.
9. Buat forum post.
10. Tambah reply forum.
11. Invoke agent MASBRE/MASBRO/MASSEH.
12. Lihat balasan agent tersimpan di message history.
13. Buka `/api/docs/openapi` untuk dokumentasi API.

## Yang Masih Bisa Ditingkatkan

- Tambah migration SQL Supabase di repo.
- Tambah tabel users, roles, workspace_members untuk multi-user sungguhan.
- Ganti opaque env token menjadi JWT access/refresh token yang signed.
- Tambah Swagger UI dari OpenAPI JSON.
- Tambah automated API test.
