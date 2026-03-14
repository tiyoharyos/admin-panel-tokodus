============================================================
          TOKODUS ADMIN PANEL - README
============================================================

Versi       : 1.0.0
Framework   : Next.js (App Router) + TypeScript
Kategori    : Admin Panel / Dashboard Manajemen Produksi


------------------------------------------------------------
DESKRIPSI PROYEK
------------------------------------------------------------

Tokodus Admin Panel adalah aplikasi web berbasis Next.js yang
dirancang untuk mengelola operasional bisnis percetakan dan
pengemasan (packaging). Sistem ini menyediakan antarmuka
admin yang lengkap untuk manajemen pesanan, material, model
box, konfigurasi produksi, hingga perhitungan harga produk.

Proyek ini menggunakan arsitektur App Router Next.js dengan
pembagian rute yang dilindungi autentikasi (protected routes)
dan halaman publik (auth).


------------------------------------------------------------
TEKNOLOGI YANG DIGUNAKAN
------------------------------------------------------------

Dependencies (Production):

  next              ^16.1.6   Framework React (App Router)
  react             19.2.3    UI Library
  react-dom         19.2.3    React DOM rendering
  axios             ^1.13.2   HTTP client untuk API requests
  sweetalert2       ^11.26.17 Dialog & notifikasi interaktif
  canvas-confetti   ^1.9.4    Animasi confetti

DevDependencies:

  typescript        ^5        Type safety & DX
  tailwindcss       ^4        Utility-first CSS framework
  @tailwindcss/postcss ^4     PostCSS plugin Tailwind
  @iconify/react    ^6.0.2    Ikon Material Design (mdi:*)
  eslint            ^9        Linter JavaScript/TypeScript
  eslint-config-next 16.1.1   ESLint config untuk Next.js
  @types/node       ^20       Type definitions Node.js
  @types/react      ^19       Type definitions React
  @types/react-dom  ^19       Type definitions React DOM


------------------------------------------------------------
FITUR UTAMA
------------------------------------------------------------

1. AUTENTIKASI
   - Login dengan email dan password
   - JWT Token management via localStorage
   - Protected routes (semua halaman membutuhkan login)
   - Axios interceptor otomatis inject Bearer Token

2. DASHBOARD
   - Ringkasan statistik produksi & pesanan
   - Tabel recent orders dengan detail lengkap
   - Overview produk & kepuasan pelanggan
   - Filter rentang waktu: Minggu / Bulan / Tahun

3. MANAJEMEN PESANAN (Orders)
   - Daftar semua pesanan dengan filter status
   - CRUD pesanan (Tambah, Lihat, Edit, Hapus)
   - Status: pending, processing, completed, shipped,
     cancelled
   - Status pembayaran: paid, unpaid, refunded
   - Pagination pada tabel pesanan

4. MANAJEMEN MATERIAL
   - Daftar tipe material (Regular & Premium)
   - CRUD tipe material dengan validasi kode

5. MODEL BOX (Box Models)
   - Manajemen model box (mailer box, shoe box, dll.)
   - Formula komponen untuk kalkulasi dimensi (P, L, T)
   - Status aktif/nonaktif model

6. KONFIGURASI FLUTE
   - Manajemen jenis flute (B, C, CB, EB, dll.)
   - CRUD flute dengan kode unik

7. KONFIGURASI PISAU (Die Cut)
   - Pisau Config  : konfigurasi pisau potong
   - Pisau Registry: registrasi pisau ke sistem

8. DUPLEX
   - Rumus DK  : kalkulasi duplex dengan rumus DK
   - Rumus DMD : kalkulasi duplex dengan rumus DMD

9. PAPER BAG
   - Manajemen ukuran, harga & tali paper bag

10. PENGATURAN LAINNYA
    - Sheet Settings  : pengaturan lembar & flute
    - Print Settings  : pengaturan cetak
    - Lamitasi        : laminasi finishing
    - Sablon          : pengaturan sablon
    - Inner Box       : konfigurasi inner box
    - Index Lain      : indeks tambahan
    - Singleface      : konfigurasi singleface
    - Other Min Order : minimum order lainnya
    - Material Testing: pengujian material


------------------------------------------------------------
STRUKTUR FOLDER
------------------------------------------------------------

admin-panel-tokodus/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx          # Halaman login
│   └── (protected)/
│       ├── layout.tsx              # Layout utama (Sidebar + Header)
│       ├── dashboard/page.tsx
│       ├── orders/page.tsx
│       ├── material/page.tsx
│       ├── materialtesting/page.tsx
│       ├── box-models/page.tsx
│       ├── flute-settings/page.tsx
│       ├── print-settings/page.tsx
│       ├── sheet-settings/
│       │   ├── sheet-index/page.tsx
│       │   └── flute-settings/page.tsx
│       ├── pisau-config/page.tsx
│       ├── pisau-registry/page.tsx
│       ├── Duplex/
│       │   ├── Rumus_dk/page.tsx
│       │   └── Rumus_dmd/page.tsx
│       ├── paperbag/
│       │   ├── price/page.tsx
│       │   ├── size/page.tsx
│       │   └── tali/page.tsx
│       ├── lamitasi/page.tsx
│       ├── sablon/page.tsx
│       ├── inner-box/page.tsx
│       ├── index_lain/page.tsx
│       ├── Singgleface-indext/page.tsx
│       └── other-minorder/page.tsx
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx             # Navigasi samping
│   │   └── Header.tsx              # Header & toggle sidebar
│   ├── UI/
│   │   ├── Button.tsx              # Tombol dengan varian & icon
│   │   ├── ButtonLink.tsx          # Tombol sebagai link
│   │   ├── Card.tsx                # Container dengan shadow
│   │   ├── Badge.tsx               # Label status berwarna
│   │   ├── Input.tsx               # Input field dengan validasi
│   │   ├── Select.tsx              # Dropdown selector
│   │   ├── TextArea.tsx            # Input teks multi-baris
│   │   ├── Modal.tsx               # Dialog popup
│   │   ├── Table.tsx               # Tabel (Row & Cell)
│   │   ├── Tabs.tsx                # Tab navigation
│   │   ├── Skeleton.tsx            # Skeleton loading
│   │   ├── LoadingState.tsx        # Indikator loading
│   │   ├── ErrorState.tsx          # Tampilan error
│   │   ├── EmptyState.tsx          # Tampilan data kosong
│   │   ├── StatsCard.tsx           # Kartu statistik
│   │   ├── Icon.tsx                # Wrapper Iconify
│   │   └── SweetAlert.tsx          # Wrapper SweetAlert2
│   ├── MaterialForm.tsx
│   ├── MaterialStockChart.tsx
│   ├── OrderModal.tsx
│   ├── ProductionOverview.tsx
│   ├── RecentOrdersTable.tsx
│   └── StatsCards.tsx
│
├── hooks/                          # Custom React Hooks
│   ├── useBoxModels.ts
│   ├── useDuplexDK.ts
│   ├── useDuplexDMD.ts
│   ├── useFlute.ts
│   ├── useIndexLainnya.ts
│   ├── useK200.ts
│   ├── useMachineStats.ts
│   ├── usePrintSettings.ts
│   ├── useSheet.ts
│   ├── useSheetSettings.ts
│   └── useSingleface.ts
│
├── services/                       # Fungsi API call (Axios)
│   ├── auth.service.ts
│   ├── boxModelService.ts
│   ├── duplexService.ts
│   ├── fluteService.ts
│   ├── indexLainnyaService.ts
│   ├── k200Service.ts
│   ├── printSettingsService.ts
│   ├── sheetService.ts
│   └── singlefaceService.ts
│
├── lib/
│   ├── axios.ts                    # Instance Axios + interceptor
│   ├── auth.ts                     # get/set/remove token
│   └── token.ts                    # Utility token
│
├── types/                          # TypeScript type definitions
├── utils/                          # Helper & utility functions
├── constants/
│   └── menu.ts                     # Data menu navigasi sidebar
│
├── public/                         # Asset statis
├── .env.local                      # Environment variable (lokal)
├── next.config.ts                  # Konfigurasi Next.js
├── postcss.config.mjs              # Konfigurasi PostCSS
└── tsconfig.json                   # Konfigurasi TypeScript


------------------------------------------------------------
PRASYARAT
------------------------------------------------------------

Pastikan sudah terinstall di komputer:

  Node.js    versi 18.x atau lebih baru
  npm        versi 9.x  atau lebih baru (sudah include Node.js)


------------------------------------------------------------
CARA MENJALANKAN PROYEK
------------------------------------------------------------

1. Masuk ke folder project
   > cd admin-panel-tokodus

2. Install semua dependensi
   > npm install

3. Buat file environment variable
   Buat file .env.local di root folder, lalu isi:

   NEXT_PUBLIC_API_URL="http://192.168.18.14:8080/Api_TokoDus/"

   Sesuaikan IP dan port dengan server backend yang digunakan.

4. Jalankan development server
   > npm run dev

   Buka browser: http://localhost:3000

5. Build untuk production
   > npm run build
   > npm start


------------------------------------------------------------
DAFTAR SCRIPT
------------------------------------------------------------

  npm run dev      Jalankan server lokal dengan hot-reload
  npm run build    Build project untuk production
  npm run start    Jalankan versi production (setelah build)
  npm run lint     Cek kode dengan ESLint


------------------------------------------------------------
KONFIGURASI API & AUTENTIKASI
------------------------------------------------------------

- Base URL API dikonfigurasi via NEXT_PUBLIC_API_URL di .env.local
- Axios instance ada di @/lib/axios dengan request interceptor
  yang otomatis menambahkan header:

    Authorization: Bearer <token>

- Token JWT disimpan di localStorage (key: "token")
- Fungsi helper token ada di @/lib/auth:
    setToken(token)   : simpan token
    getToken()        : ambil token
    removeToken()     : hapus token (logout)


------------------------------------------------------------
TROUBLESHOOTING
------------------------------------------------------------

Module not found / error saat install
  > Hapus node_modules lalu install ulang:
    rm -rf node_modules
    npm install

API error / data tidak muncul
  > Pastikan backend sudah berjalan dan URL di .env.local
    sudah benar dan bisa diakses dari mesin ini.

Port 3000 sudah dipakai
  > Jalankan di port lain:
    npm run dev -- -p 3001


------------------------------------------------------------
CATATAN PENGEMBANGAN
------------------------------------------------------------

- Beberapa halaman (dashboard, orders) masih menggunakan
  mock data dan belum terhubung ke API backend.

- Halaman yang sudah terintegrasi API nyata:
  material, flute-settings, box-models, duplex,
  sheet-settings, dan beberapa konfigurasi lainnya.

- Gunakan komponen SweetAlert di @/components/UI/SweetAlert
  untuk semua notifikasi sukses/error agar konsisten.

- Path alias "@/" sudah dikonfigurasi di tsconfig.json,
  mengarah ke root folder project.


============================================================