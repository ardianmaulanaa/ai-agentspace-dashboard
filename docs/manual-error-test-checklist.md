# Manual Error Test Checklist

Base URL:

```bash
BASE_URL=http://localhost:3102
COOKIE_JAR=/tmp/agentspace-cookies.txt
```

## 1. Auth & Security

Belum login harus ditolak:

```bash
curl -i "$BASE_URL/api/auth/me"
```

Expected: `401 Unauthorized`.

Login password salah:

```bash
curl -i -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"ardian","password":"password-salah"}'
```

Expected: `401 Unauthorized`.

Rate limit login salah:

```bash
for i in 1 2 3 4 5 6; do
  curl -i -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"rate-test","password":"password-salah"}'
  echo
done
```

Expected: percobaan terakhir `429 Too Many Requests` dengan header `Retry-After`.

Login benar dan simpan cookie:

```bash
curl -i -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"ardian","password":"ISI_PASSWORD_ADMIN_LOKAL"}'
```

Expected: `200 OK`, cookie `agentspace_access` dan `agentspace_refresh`.

Refresh token:

```bash
curl -i -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/refresh"
```

Expected: `200 OK`.

Logout:

```bash
curl -i -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/logout"
curl -i -b "$COOKIE_JAR" "$BASE_URL/api/auth/me"
```

Expected: logout `200 OK`, lalu `/api/auth/me` menjadi `401 Unauthorized`.

## 2. RBAC

Endpoint admin tanpa login:

```bash
curl -i "$BASE_URL/api/admin/users"
```

Expected: `401 Unauthorized`.

Endpoint workspace management tanpa login:

```bash
curl -i "$BASE_URL/api/workspace-members?workspaceId=agentspace"
```

Expected: `401 Unauthorized`.

Setelah login sebagai admin, endpoint admin:

```bash
curl -i -b "$COOKIE_JAR" "$BASE_URL/api/admin/users"
```

Expected: `200 OK`.

## 3. Validation Errors

JSON kosong untuk category:

```bash
curl -i -b "$COOKIE_JAR" -X POST "$BASE_URL/api/categories" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: `400 Bad Request`.

Channel type salah:

```bash
curl -i -b "$COOKIE_JAR" -X POST "$BASE_URL/api/channels" \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"agentspace","name":"invalid-type-channel","type":"wrong"}'
```

Expected: `400 Bad Request`.

Role salah:

```bash
curl -i -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/admin/users" \
  -H "Content-Type: application/json" \
  -d '{"userId":"00000000-0000-0000-0000-000000000000","role":"superadmin"}'
```

Expected: `400 Bad Request`.

UUID salah:

```bash
curl -i -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/messages/bukan-uuid" \
  -H "Content-Type: application/json" \
  -d '{"content":"test"}'
```

Expected: `400 Bad Request`.

Workspace tidak ada:

```bash
curl -i -b "$COOKIE_JAR" "$BASE_URL/api/messages?workspaceId=workspace-tidak-ada"
```

Expected: `404 Not Found`.

## 4. Upload Validation

Mime tidak cocok dengan data URL:

```bash
curl -i -b "$COOKIE_JAR" -X POST "$BASE_URL/api/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId":"agentspace",
    "channelId":"ide-project",
    "content":"upload invalid",
    "attachmentData":"data:image/png;base64,iVBORw0KGgo=",
    "attachmentName":"demo.jpg",
    "attachmentMime":"image/jpeg"
  }'
```

Expected: `400 Bad Request`.

Mime tidak didukung:

```bash
curl -i -b "$COOKIE_JAR" -X POST "$BASE_URL/api/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId":"agentspace",
    "channelId":"ide-project",
    "content":"upload invalid",
    "attachmentData":"data:application/pdf;base64,JVBERi0=",
    "attachmentName":"demo.pdf",
    "attachmentMime":"application/pdf"
  }'
```

Expected: `400 Bad Request`.

## 5. Pagination, Search, Filter

List message normal:

```bash
curl -i -b "$COOKIE_JAR" "$BASE_URL/api/messages?workspaceId=agentspace&channelId=ide-project&page=1&limit=5"
```

Expected: `200 OK`, ada object `pagination`.

Search message:

```bash
curl -i -b "$COOKIE_JAR" "$BASE_URL/api/messages?workspaceId=agentspace&channelId=ide-project&search=dashboard"
```

Expected: `200 OK`, ada object `filters.search`.

Filter sender type:

```bash
curl -i -b "$COOKIE_JAR" "$BASE_URL/api/messages?workspaceId=agentspace&channelId=ide-project&senderType=agent"
```

Expected: `200 OK`, ada object `filters.senderType`.

## 6. Docs

OpenAPI:

```bash
curl -i "$BASE_URL/api/docs/openapi"
```

Expected: `200 OK`, body berisi `"openapi":"3.0.3"`.

Postman Collection:

```bash
node -e "JSON.parse(require('fs').readFileSync('docs/postman-collection.json','utf8')); console.log('Postman JSON valid')"
```

Expected: `Postman JSON valid`.
