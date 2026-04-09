# Tokodus Admin Panel

> Internal admin dashboard for managing production operations of a packaging & printing business (percetakan dan pengemasan).

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | ^16.1.6 |
| Language | TypeScript | ^5 |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | ^4 |
| HTTP Client | Axios | ^1.13.2 |
| Charts | Recharts | ^3.8.1 |
| Icons | @iconify/react | ^6.0.2 |
| Alerts/Dialogs | SweetAlert2 | ^11.26.17 |
| PostCSS | @tailwindcss/postcss | ^4 |

---

## Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- Backend API running (default: `http://192.168.18.14:8080/Api_TokoDus/`)

---

## Getting Started

```bash
# 1. Clone & masuk direktori
cd admin-panel-tokodus

# 2. Install dependencies
npm install

# 3. Buat environment file
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL sesuai alamat backend

# 4. Jalankan dev server
npm run dev
# → http://localhost:3000

# 5. Build production
npm run build
npm start
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL="http://<backend-host>:<port>/Api_TokoDus/"
```

> ⚠️ Variabel ini diekspos ke client-side (prefix `NEXT_PUBLIC_`). Pastikan tidak menyimpan secrets di sini.

---

## NPM Scripts

| Script | Perintah | Keterangan |
|---|---|---|
| `dev` | `next dev` | Dev server dengan hot-reload |
| `build` | `next build` | Compile & optimasi production |
| `start` | `next start` | Jalankan hasil build production |
| `lint` | `eslint` | Static analysis dengan ESLint |

---

## Project Structure

```
admin-panel-tokodus/
│
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx             # Halaman login (public)
│   │
│   └── (protected)/                 # Semua route memerlukan JWT
│       ├── dashboard/page.tsx
│       ├── orders/page.tsx
│       ├── material/page.tsx
│       ├── box-models/
│       │   ├── page.tsx
│       │   ├── hooks/               # useBoxModelActions, useBoxModels, useFormulaState
│       │   ├── lib/utils.ts
│       │   ├── types/types.ts
│       │   └── constants/
│       ├── flute-settings/
│       ├── Duplex/
│       │   ├── Rumus_dk/
│       │   └── Rumus_dmd/
│       ├── lamitasi/
│       │   ├── lamitasi/
│       │   └── sablon/
│       ├── Singgleface-indext/
│       ├── index_lain/
│       ├── print/
│       │   ├── print-settings/
│       │   └── other-minorder/
│       ├── pisau/
│       │   ├── pisau-config/
│       │   └── pisau-registry/
│       ├── paperbag/
│       │   ├── tali/
│       │   ├── size/
│       │   └── price/
│       └── sheet-settings/
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx               # Top navigation bar
│   │   └── Sidebar.tsx              # Sidebar navigasi dengan nested menu
│   ├── UI/
│   │   ├── Button.tsx, Input.tsx, Select.tsx, TextArea.tsx
│   │   ├── Modal.tsx, Table.tsx, Tabs.tsx
│   │   ├── Badge.tsx, Card.tsx, StatsCard.tsx
│   │   ├── LoadingState.tsx, EmptyState.tsx, ErrorState.tsx, Skeleton.tsx
│   │   ├── SweetAlert.tsx           # Wrapper SweetAlert2
│   │   ├── Chart.tsx                # Wrapper Recharts
│   │   ├── Chat.tsx                 # Komponen chat/AI
│   │   ├── PageContainer.tsx, PageHeader.tsx
│   │   └── AuthLoadingScreen.tsx
│   ├── AuthWrapper.tsx              # Client-side route guard
│   ├── ErrorBoundary.tsx
│   ├── MaterialForm.tsx
│   ├── MaterialStockChart.tsx
│   ├── OrderModal.tsx
│   ├── ProductionOverview.tsx
│   ├── RecentOrdersTable.tsx
│   └── StatsCards.tsx
│
├── hooks/
│   └── useAuth.ts                   # Auth state + logout handler
│
├── lib/
│   ├── axios.ts                     # Axios instance + request interceptor
│   ├── auth.ts                      # Token helpers (set/get/remove)
│   └── token.ts
│
├── services/
│   └── auth.service.ts              # Login API call
│
├── constants/
│   └── menu.ts                      # NavItem type + navItems config
│
├── public/
│   └── material/                    # Aset gambar & logo
│
├── .env.local                       # Environment variables (tidak di-commit)
├── next.config.ts                   # Next.js config (allowedDevOrigins)
├── tsconfig.json                    # TypeScript config (strict mode, path alias @/)
├── postcss.config.mjs               # PostCSS + Tailwind setup
└── eslint.config.mjs                # ESLint config
```

---

## Architecture & Patterns

### Route Groups (Next.js App Router)

Proyek menggunakan dua route groups:

- `(auth)` — route publik, hanya berisi `/login`
- `(protected)` — semua halaman admin; setiap halaman dibungkus `AuthWrapper` untuk redirect ke `/login` jika tidak ada token

### Per-Feature Module Pattern

Setiap fitur kompleks (box-models, flute-settings, duplex, dll.) mengikuti struktur internal yang konsisten:

```
feature/
├── page.tsx           # UI entry point
├── hooks/             # Custom hooks (data fetching, aksi CRUD)
├── lib/utils.ts       # Utility & kalkulasi formula
├── types/types.ts     # TypeScript interfaces
└── constants/         # Konstanta lokal (API paths, opsi dropdown)
```

### Authentication Flow

```
User → /login → POST /auth/login → JWT token
                                      ↓
                              localStorage.setItem('token', ...)
                                      ↓
                         axios.interceptors.request: Authorization: Bearer <token>
                                      ↓
                         AuthWrapper: getToken() → redirect jika null
```

Token disimpan di `localStorage` dan diinjeksi otomatis ke setiap request melalui Axios request interceptor di `lib/axios.ts`.

### Axios Instance (`lib/axios.ts`)

```typescript
const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://192.168.18.14:8080/Api_TokoDus'
})

instance.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
```

### TypeScript Configuration

- **Strict mode** aktif (`"strict": true`)
- **Path alias**: `@/*` → root project (`./`)
- **Target**: `ES2017`, module resolution: `bundler`
- **JSX**: `react-jsx` (tidak perlu import React manual)

### Navigation Config (`constants/menu.ts`)

Sidebar di-render secara dinamis dari array `navItems` bertipe `NavItem[]`. Mendukung nested menu via field `subItems`.

---

## Module Overview

| Module | Path | API Status |
|---|---|---|
| Dashboard | `/dashboard` | Mock data |
| Orders | `/orders` | Mock data |
| Material | `/material` | ✅ Terintegrasi API |
| Box Models | `/box-models` | ✅ Terintegrasi API |
| Flute Settings | `/flute-settings` | ✅ Terintegrasi API |
| Duplex (DK) | `/Duplex/Rumus_dk` | ✅ Terintegrasi API |
| Duplex (DMD) | `/Duplex/Rumus_dmd` | ✅ Terintegrasi API |
| Laminasi | `/lamitasi/lamitasi` | ✅ Terintegrasi API |
| Sablon | `/lamitasi/sablon` | ✅ Terintegrasi API |
| Singleface | `/Singgleface-indext` | ✅ Terintegrasi API |
| Index Lain | `/index_lain` | ✅ Terintegrasi API |
| Sheet Settings | `/sheet-settings` | ✅ Terintegrasi API |
| Print Settings | `/print` | ✅ Terintegrasi API |
| Pisau Config/Registry | `/pisau` | ✅ Terintegrasi API |
| Paperbag | `/paperbag` | ✅ Terintegrasi API |

---

## Troubleshooting

**`Module not found` atau install error**
```bash
rm -rf node_modules .next
npm install
```

**API error / data tidak muncul**
- Pastikan backend running dan dapat diakses dari mesin development
- Cek nilai `NEXT_PUBLIC_API_URL` di `.env.local`
- Buka DevTools → Network → lihat response error dari API

**Port 3000 sudah terpakai**
```bash
npm run dev -- -p 3001
```

**Dev server hanya bisa diakses dari `localhost`**
```bash
npm run dev -- -H 0.0.0.0
```
Pastikan `allowedDevOrigins` di `next.config.ts` mencakup IP yang ingin diakses.

---

## Development Notes

- Gunakan `@/components/UI/SweetAlert` untuk semua notifikasi sukses/error — jangan `alert()` native
- Semua custom hook untuk data fetching ada di dalam folder `hooks/` masing-masing feature
- Kalkulasi harga & formula dimensi box ada di `lib/utils.ts` tiap feature (bukan di komponen UI)
- `components/UI/Chart.tsx` adalah wrapper Recharts — gunakan ini agar konfigurasi chart konsisten
- Path alias `@/` sudah dikonfigurasi; tidak perlu relative imports panjang seperti `../../components`