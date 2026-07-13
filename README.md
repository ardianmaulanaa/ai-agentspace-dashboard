# AI AgentSpace Management System

## Deskripsi

AI AgentSpace Management System merupakan aplikasi backend yang digunakan untuk mengelola workspace AI, pengguna, dan aktivitas agent dalam satu platform. Sistem ini dibuat untuk mempermudah pengelolaan AI Agent yang digunakan oleh banyak pengguna dengan hak akses yang berbeda.

Pada sistem ini, setiap pengguna dapat bergabung ke dalam sebuah workspace sesuai dengan perannya. Workspace memiliki beberapa AI Agent yang dapat digunakan untuk menjalankan berbagai aktivitas. Seluruh aktivitas tersebut akan disimpan sebagai riwayat sehingga dapat dipantau kembali oleh pemilik workspace maupun administrator.

Project ini dikembangkan sebagai tugas besar Backend Study Group dengan menerapkan konsep REST API, autentikasi JWT, Role-Based Access Control (RBAC), serta arsitektur backend yang modular.

---

# Tujuan

- Membangun REST API yang terstruktur dan mudah dikembangkan.
- Menerapkan autentikasi yang aman menggunakan JWT.
- Mengimplementasikan Role-Based Access Control (RBAC).
- Mengelola data workspace, AI Agent, dan aktivitas pengguna.
- Menyediakan laporan penggunaan AI Agent berdasarkan aktivitas yang dilakukan.

---

# Fitur

## Authentication

- Register pengguna
- Login
- Logout
- Refresh Access Token
- Melihat profil pengguna (Current User)

---

## Workspace Management

- Membuat Workspace
- Mengubah informasi Workspace
- Menghapus Workspace
- Melihat daftar Workspace
- Melihat detail Workspace

---

## Member Management

- Menambahkan anggota ke Workspace
- Mengubah role anggota
- Menghapus anggota
- Melihat seluruh anggota Workspace

---

## AI Agent Management

- Membuat AI Agent
- Mengubah data AI Agent
- Menghapus AI Agent
- Mengaktifkan atau menonaktifkan Agent
- Melihat daftar AI Agent

---

## Activity Management

- Menjalankan aktivitas AI Agent
- Menyimpan riwayat aktivitas
- Melihat histori penggunaan AI Agent
- Melihat detail aktivitas

---

## Analytics

- Total penggunaan AI Agent
- Statistik aktivitas Workspace
- Statistik penggunaan setiap Agent
- Rekap penggunaan berdasarkan periode

---

# Role Pengguna

## Admin

Admin memiliki akses penuh terhadap seluruh sistem.

Hak akses:

- Mengelola seluruh pengguna
- Mengelola seluruh Workspace
- Mengelola seluruh AI Agent
- Melihat seluruh aktivitas sistem
- Melihat statistik sistem

---

## Workspace Owner

Workspace Owner bertanggung jawab terhadap Workspace yang dimiliki.

Hak akses:

- Membuat Workspace
- Mengelola anggota
- Mengelola AI Agent
- Melihat aktivitas Workspace
- Melihat laporan penggunaan

---

## Member

Member hanya memiliki akses terhadap Workspace yang diikutinya.

Hak akses:

- Melihat AI Agent
- Menggunakan AI Agent
- Melihat riwayat aktivitas pribadi

---

# Teknologi

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- MySQL
- JWT Authentication
- bcrypt
- Zod Validation
- Swagger OpenAPI
- Multer
- Express Rate Limit

---

# Struktur Folder

```text
backend/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│
├── config/
├── controllers/
├── middlewares/
├── routes/
├── services/
├── validations/
├── utils/
├── types/
│
├── app.ts
└── server.ts
```

---

# Keamanan

Beberapa mekanisme keamanan yang diterapkan antara lain:

- JWT Access Token
- JWT Refresh Token
- Password Hashing menggunakan bcrypt
- Middleware Authentication
- Role-Based Access Control (RBAC)
- Request Validation menggunakan Zod
- Rate Limiting pada endpoint login
- Global Error Handling

---

# Dokumentasi API

Seluruh endpoint didokumentasikan menggunakan Swagger sehingga proses pengujian API dapat dilakukan secara langsung melalui browser.

Selain Swagger, pengujian endpoint juga dapat dilakukan menggunakan Postman.

---

# Pengujian

Beberapa skenario pengujian yang dilakukan antara lain:

- Register pengguna
- Login dan Logout
- Refresh Token
- CRUD Workspace
- CRUD AI Agent
- CRUD Member
- Aktivitas AI Agent
- Hak akses setiap Role
- Validasi input
- Error Handling

---

# Pengembangan Selanjutnya

Beberapa fitur yang dapat ditambahkan pada pengembangan berikutnya antara lain:

- Integrasi AI API (OpenAI, Gemini, Claude, dan lain-lain)
- Notifikasi real-time
- Dashboard analitik yang lebih lengkap
- Monitoring penggunaan token AI
- Upload dokumen untuk knowledge base
- Riwayat percakapan AI

---

# Kesimpulan

AI AgentSpace Management System merupakan backend REST API yang dirancang untuk mengelola Workspace AI secara terstruktur. Dengan menerapkan autentikasi JWT, RBAC, validasi data, dan arsitektur modular, sistem ini diharapkan dapat menjadi dasar pengembangan platform AI yang aman, mudah dikelola, dan dapat dikembangkan lebih lanjut sesuai kebutuhan.
