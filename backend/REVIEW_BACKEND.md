# Review Backend — FC Barcelona Squad Information System

Dokumen ini merangkum review logic, alasan arsitektur, cara kerja API, dan cara frontend mengambil data. Rancangan utama proyek tetap berada di `RANCANGAN.md`.

## 1. Gambaran Umum

Backend mengikuti pola:

```text
React Frontend -> REST API Express -> Prisma ORM -> MySQL
```

Frontend tidak mengakses MySQL secara langsung. React hanya meminta atau mengirim data melalui HTTP ke REST API. Backend yang menjalankan validasi, aturan bisnis, dan query database.

## 2. Data dan Relasi Database

Sistem memiliki lima entitas utama.

| Tabel | Fungsi |
| --- | --- |
| `clubs` | Menyimpan informasi klub. |
| `players` | Menyimpan data pemain. |
| `positions` | Master posisi pemain, misalnya Goalkeeper atau Forward. |
| `coaches` | Menyimpan data staf pelatih. |
| `roles` | Master peran pelatih, misalnya Coach atau Assistant Coach. |

Relasi datanya adalah:

```text
clubs     1 ---- N players
clubs     1 ---- N coaches
positions 1 ---- N players
roles     1 ---- N coaches
```

Artinya, setiap player wajib memiliki satu club dan satu position. Setiap coach wajib memiliki satu club dan satu role. Satu club, position, atau role dapat dipakai oleh banyak data anak.

Pada Prisma schema, foreign key juga diberi index. Ini membantu database mencari data relasi lebih efisien.

## 3. Review Logic Backend

Setiap resource (`clubs`, `players`, `positions`, `coaches`, dan `roles`) memiliki operasi CRUD:

- `GET`: mengambil data.
- `POST`: membuat data baru.
- `PUT`: memperbarui data.
- `DELETE`: menghapus data.

Logic penting yang sudah diterapkan:

- ID dari URL harus berupa integer positif.
- Field input divalidasi, misalnya nama tidak boleh kosong, umur harus berada dalam rentang yang ditentukan, dan nomor punggung berada di rentang 1–99.
- Saat player atau coach dibuat/diubah, backend mengecek dahulu apakah `club_id`, `position_id`, atau `role_id` benar-benar ada.
- Nomor punggung player tidak boleh sama dalam club yang sama.
- Position, role, dan club yang masih digunakan tidak dapat dihapus dari jalur API. Tujuannya agar player atau coach tidak hilang tanpa disengaja.
- List player menyertakan `club` dan `position`; list coach menyertakan `club` dan `role`. Frontend tidak perlu melakukan request tambahan hanya untuk membaca nama posisi atau peran.
- Response API dibuat konsisten dengan properti `success`, `data`, `count`, dan `message`.

Contoh response list:

```json
{
  "success": true,
  "data": [],
  "count": 0
}
```

Contoh response error:

```json
{
  "success": false,
  "message": "Player not found"
}
```

### Catatan Review

1. Relasi Prisma memakai `onDelete: Cascade`, tetapi controller API menolak penghapusan club, position, atau role yang masih dipakai. Untuk pemakaian melalui API, guard controller ini mencegah penghapusan berantai. Pada pengembangan lanjutan, aturan database dapat dibuat `Restrict` agar sepenuhnya selaras dengan aturan API.

2. Pemeriksaan duplikasi position, role, dan nomor punggung sudah ada di controller. Namun, belum ada unique constraint pada database. Dalam situasi dua request bersamaan, constraint database akan menjadi perlindungan tambahan yang lebih kuat.

3. Hook `useClub` menyimpan promise hasil request club di level modul. Ini menghindari request ganda dari Navbar dan Sejarah, tetapi data dapat menjadi tidak terbaru bila CMS mengubah club tanpa halaman di-refresh.

## 4. Kenapa Menggunakan Prisma?

Prisma adalah ORM (*Object Relational Mapper*), yaitu alat yang menerjemahkan operasi JavaScript menjadi query MySQL.

Contoh:

```js
prisma.players.findMany()
```

Prisma akan membuat query untuk mengambil data dari tabel `players`.

Alasan memakai Prisma:

- Query database lebih mudah dibaca daripada SQL mentah.
- Relasi mudah dimuat menggunakan `include`, misalnya player sekaligus dengan club dan position.
- `schema.prisma` menjadi dokumentasi struktur database.
- Migration mencatat perubahan struktur database agar dapat diulang di komputer lain.
- Prisma membantu penggunaan query terparameterisasi, sehingga lebih aman daripada menyusun SQL secara manual.
- Versi Prisma `6.19.3` dipilih agar tetap sesuai dengan CommonJS dan seed berbasis JavaScript pada proyek ini.

## 5. Kenapa Backend Dipisah Menjadi Config, Controller, Middleware, dan Lainnya?

Pemisahan folder bukan kewajiban teknis, tetapi membuat kode lebih mudah dibaca, dirawat, diuji, dan dijelaskan saat presentasi.

| Bagian | Pengertian | Peran dalam proyek |
| --- | --- | --- |
| `config/` | Tempat konfigurasi bersama. | `database.js` membuat satu instance PrismaClient yang dipakai seluruh aplikasi. |
| `controllers/` | Tempat logic setiap endpoint. | Memvalidasi input, mengecek relasi, menjalankan Prisma, dan mengirim response. |
| `routes/` | Peta method HTTP dan URL menuju controller. | Contoh `GET /api/players` diarahkan ke `getPlayers`. |
| `middleware/` | Fungsi yang berjalan dalam perjalanan request-response. | Menangani route yang tidak ada, JSON rusak, error Prisma, dan error internal. |
| `app.js` | Tempat merakit aplikasi Express. | Memasang CORS, parser JSON, static image, route, serta middleware error. |
| `server.js` | Titik awal menjalankan server. | Memuat environment, memastikan database terkoneksi, lalu membuka port. |
| `prisma/` | Tempat definisi dan pengelolaan database. | Berisi schema, migration, dan seed data. |

### Alur Request

Alur request menjelaskan mengapa lapisan-lapisan ini ada:

```text
Client -> app.js -> routes -> controller -> config/database (Prisma) -> MySQL
                        |
                     middleware  <---- error
```

### Penjelasan Tiap Lapisan

**`server.js` — pintu start**

`start()` memanggil `prisma.$connect()` lebih dahulu. Bila koneksi database gagal, server memanggil `process.exit(1)` dan tidak ikut menyala. Bila berhasil, barulah `app.listen(PORT, ...)` dijalankan. Artinya server tidak pernah menerima request selama database belum terhubung. Blok `server.on("error")` menangani kasus `EADDRINUSE` (port sudah dipakai).

**`app.js` — perakit**

Urutan `app.use` menentukan urutan eksekusi:

- `cors()` mengizinkan frontend dari origin berbeda mengakses API.
- `express.json()` mengubah body JSON menjadi `req.body`.
- `express.static("/images", ...)` menyajikan file foto dari `backend/public/images`.
- `GET /api` menjadi index endpoint yang mendaftar endpoint yang tersedia.
- Baris `app.use("/api/...", router)` memasang tiap router pada prefix URL-nya.
- `notFoundHandler` menangkap semua URL yang tidak cocok route dan diletakkan paling akhir sebelum error handler.
- `errorHandler` menjadi penampung error terakhir.

Perbedaan `app.js` dan `server.js`: `app.js` hanya merakit aplikasi dan tidak melakukan `listen`, sedangkan `server.js` yang menjalankannya. Pemisahan ini memudahkan pengujian karena app dapat diimpor tanpa membuka port.

**`routes/` — peta URL**

Route tidak berisi logic. Tugasnya hanya memetakan method HTTP dan URL ke controller yang tepat.

```js
router.get("/", getPlayers);        // GET    /api/players
router.get("/:id", getPlayerById);  // GET    /api/players/5
router.post("/", createPlayer);     // POST   /api/players
router.put("/:id", updatePlayer);   // PUT    /api/players/5
router.delete("/:id", deletePlayer);// DELETE /api/players/5
```

Route dipisah dari controller agar perubahan URL cukup diubah pada satu baris di routes, tanpa menyentuh controller. Analoginya, route adalah papan alamat dan controller adalah isi pekerjaan.

- Nilai `/:id` adalah parameter dinamis dan masuk ke `req.params.id`.
- Nilai `?search=` adalah query dan masuk ke `req.query`.
- Prefix `/api/players` berasal dari `app.js`, sehingga `router.get("/")` sama dengan `/api/players`.

**`controllers/` — pekerjaan nyata**

Controller menjalankan empat langkah berurutan: validasi input, cek relasi, jalankan Prisma, lalu kirim response.

Pada `playerController.js`:

- `getPlayers` membaca query `?search`, `?position`, dan `?club`, membangun objek `where`, lalu memanggil `prisma.players.findMany`. Properti `include: { club, position }` ikut memuat data relasi.
- `createPlayer` memanggil `validatePlayer`, lalu `checkPlayerForeignKeys` (memastikan club dan position benar-benar ada, berbeda dari error foreign key Prisma), lalu memeriksa bentrok `squad_number`, baru menjalankan `create`.
- Semua error tak tertangani ditangkap `catch` lalu dilempar dengan `next(error)` ke `errorHandler` di middleware.

Pola wajib controller: `async function(req, res, next)` dengan `try/catch` dan `next(error)`. Tanpa `next(error)`, error akan menggantung dan request tidak selesai.

**`config/database.js` — satu instance global**

`database.js` membuat satu `PrismaClient` lalu mengekspornya. Semua controller mengimpor instance yang sama. Bila setiap file membuat `new PrismaClient()`, koneksi akan menumpuk sehingga boros pool database, lambat, dan berpotensi crash. Selalu gunakan `require("../config/database")`, jangan membuat instance baru.

**`middleware/errorMiddleware.js` — penjaring**

Middleware berjalan di perjalanan request-response, bukan sebagai handler endpoint.

- `notFoundHandler` membalas 404 berformat JSON rapi (bukan HTML default Express) untuk request yang lolos semua route.
- `errorHandler` menangkap error dari `next(error)`. Parameter `err` di posisi pertama adalah ciri middleware error Express (wajib empat argumen).

Urutan pemeriksaannya penting:

1. JSON rusak (misalnya body `{bad json`) ditangkap `express.json()` sebagai 400.
2. Error custom dari controller (memakai penanda `isApiError`) memakai `statusCode`-nya.
3. Error Prisma: `P2025` (data tidak ada) menjadi 404, `P2002` (duplikat) menjadi 400, `P2003` (foreign key) menjadi 400.
4. Error tak terduga dicatat di server, sementara client hanya menerima "Internal server error".

Tujuan pemusatan ini: error Prisma yang teknis (seperti `err.meta` atau nama kolom) tidak boleh bocor ke client. Middleware ini penyaring terakhir agar client selalu menerima JSON `{ success: false, message }` yang konsisten.

### Ringkas Tanggung Jawab

| Folder | Tugas | Analogi |
| --- | --- | --- |
| `server.js` | Start + cek DB | Nyalakan mesin |
| `app.js` | Rakit middleware + route | Rangkai mesin |
| `routes/` | Peta URL ke controller | Papan alamat |
| `controllers/` | Validasi + logic + response | Pekerja |
| `config/database.js` | Satu koneksi Prisma | Kabel DB |
| `middleware/` | Jaring error dan 404 | Jaring pengaman |

Keuntungan utamanya adalah setiap file mempunyai satu tanggung jawab yang jelas. Route tidak bercampur dengan query database, penanganan error tidak diulang pada setiap endpoint, dan konfigurasi koneksi database tidak tersebar di banyak file.

## 6. Cara Kerja API

Base URL API:

```text
http://localhost:5000/api
```

Contoh endpoint player:

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| `GET` | `/players` | Mengambil semua player. |
| `GET` | `/players?search=Lamine` | Mencari player berdasarkan nama. |
| `GET` | `/players?position=Forward&club=1` | Memfilter player berdasarkan position dan club. |
| `GET` | `/players/:id` | Mengambil detail satu player. |
| `POST` | `/players` | Membuat player baru. |
| `PUT` | `/players/:id` | Mengubah player. |
| `DELETE` | `/players/:id` | Menghapus player. |

Pola endpoint yang sama juga tersedia untuk `clubs`, `positions`, `coaches`, dan `roles`.

Status code yang dipakai:

| Status | Makna |
| --- | --- |
| `200 OK` | Request berhasil. |
| `201 Created` | Data baru berhasil dibuat. |
| `400 Bad Request` | Input atau relasi tidak valid. |
| `404 Not Found` | Data atau route tidak ditemukan. |
| `500 Internal Server Error` | Terjadi error tak terduga di server. |

## 7. Cara Frontend Mengambil Data

Frontend memakai satu API client di `frontend/src/api/client.js`. Client ini menyimpan base URL API, membuat query parameter, menjalankan `fetch`, memeriksa status response, dan meneruskan pesan error ke komponen.

Contoh fungsi pengambilan player:

```js
export const getPlayers = (params) => request(`/players${toQuery(params)}`)
```

Fungsi `request()` melakukan langkah berikut:

1. Mengirim `fetch` ke URL API.
2. Membaca response JSON.
3. Memeriksa apakah HTTP response sukses dan `payload.success` bernilai `true`.
4. Mengembalikan `payload.data` ke komponen.
5. Melempar error yang mudah dibaca bila backend tidak dapat dihubungi atau request gagal.

Penggunaan di tampilan:

- `Players.jsx` mengirim fungsi `getPlayers` ke komponen `SquadGrid`.
- `Coaches.jsx` mengirim fungsi `getCoaches` ke komponen yang sama.
- `SquadGrid` memanggil fungsi tersebut di dalam `useEffect`, kemudian menyimpan hasilnya ke state React.
- Selama request berjalan, tampilan menunjukkan status loading. Jika gagal, tampilan menunjukkan pesan error. Jika berhasil, data dirender menjadi card.
- `photo_url` di database berupa path relatif, misalnya `/images/players/...`. Fungsi `assetUrl()` menyambungkannya dengan origin backend agar foto dapat dimuat browser.
- `useClub` mengambil data club untuk Navbar dan Sejarah, sekaligus menghindari request ganda pada saat yang sama.

## 8. Alur Sistem

```text
User membuka halaman React
        ↓
Komponen Players / Coaches dirender
        ↓
useEffect memanggil getPlayers() / getCoaches()
        ↓
client.js menjalankan fetch ke http://localhost:5000/api/...
        ↓
Express menerima request melalui app.js
        ↓
Route memilih controller yang sesuai
        ↓
Controller memvalidasi input dan aturan bisnis
        ↓
Prisma menjalankan query ke MySQL
        ↓
MySQL mengembalikan data
        ↓
Controller mengirim JSON { success, data, count }
        ↓
React menyimpan data di state dan merender card pemain atau pelatih
```
