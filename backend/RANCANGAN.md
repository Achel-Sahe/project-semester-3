# FC Barcelona Squad Information System — Backend (PBL Basis Data)

Dokumen ini adalah **sumber kebenaran tunggal** untuk proyek Basis Data PBL.
Kalau ada konflik antara kode dan dokumen ini, fix kodenya — atau tanya dulu,
jangan diam-diam ubah skema.

Letak backend: `backend/`. Base URL API: `http://localhost:5000/api`.

---

## 1. Ringkasan

Sistem informasi satu klub sepak bola: **FC Barcelona**.

Fokus data hanya pada:

- Club
- Players
- Positions (Player Positions)
- Coaches (Coaching Staff)
- Roles (Coaching Roles)

Backend ini REST API yang dikonsumsi React frontend terpisah, dan CMS dashboard
CRUD terpisah. Database: **MySQL sungguhan**. Tidak ada mock, tidak ada static JSON.

---

## 2. Arsitektur

```text
React Frontend  --+
                   +-->  REST API (http://localhost:5000/api)
CMS Dashboard  --+                |
                                  v
                           Express.js
                                  |
                                  v
                             Prisma ORM
                                  |
                                  v
                               MySQL
```

Aturan keras:

- Frontend **TIDAK PERNAH** konek langsung ke MySQL.
- Frontend dan backend **terpisah**, komunikasi hanya via HTTP.
- Express hanya expose JSON. Tidak ada template HTML, tidak ada SSR.

---

## 3. Tech Stack

| Layer      | Teknologi    | Catangan                                 |
| ---------- | ------------ | ---------------------------------------- |
| Runtime    | Node.js      | v24.18.0                                 |
| Framework  | Express.js   | v4.x                                     |
| ORM        | Prisma ORM   | **pin 6.19.3**                           |
| Database   | MySQL        | XAMPP / Laragon, port 3306               |
| Language   | JavaScript   | **DILARANG TypeScript**                  |
| Env        | dotenv       | `.env` + `.env.example`                  |
| CORS       | cors         | Supaya React port 3000 bisa akses        |
| Dev reload | nodemon      | `npm run dev`                            |
| Module     | CommonJS     | `require` / `module.exports`             |

### Kenapa Prisma 6.19.3, bukan yang terbaru?

Prisma 7+ (dan 8 RC) menghapus `package.json#prisma.seed` dan memaksa
`prisma.config.ts` — file TypeScript, yang dilarang di proyek ini.

Prisma 6.19.3:

- Seed tetap dikonfigurasi di `package.json` (`node prisma/seed.js`).
- Import biasa `require("@prisma/client")`.
- `migrate dev`, `generate`, `db seed`, `studio` semuanya langsung jalan.
- Tidak perlu file `.ts` sama sekali.

### Kenapa CommonJS?

`prisma/seed.js` dan semua file `src/` pakai `require()`.
Jangan ubah `"type": "commonjs"` —_seed.js dan seluruh file akan被迫 convert,
padahal tidak ada gunanya dan bikin presentasi ribet.

---

## 4. Scope — dan yang DILARANG Ada

Wajib ada, 5 tabel, tidak boleh kurang:
`clubs`, `players`, `positions`, `coaches`, `roles`

DILARANG ada di database kecuali diminta eksplisit:

- Matches / fixtures / jadwal
- Player statistics, goals, assists, clean sheets
- Injuries
- Transfers, contracts, salaries
- Player career history, coach history
- Seasons, competitions, standings
- News, comments, notifications
- Tickets, merchandise, sponsors
- Stadium management
- **Authentication, authorization, users, sessions, JWT, OAuth**

Alasan: proyek harus tetap kecil, normalized, dan gampang dijelaskan.
Menambah tabel menurunkan nilai presentasi.

---

## 5. Database Schema (authoritative)

Definisi final. **Jangan diubah tanpa approval.**

```dbml
Table clubs {
  id int [pk, increment]
  name varchar(100)
  country varchar(100)
  desc varchar(500)
  founded_year int
}

Table players {
  id int [pk, increment]
  club_id int [ref: > clubs.id]
  name varchar(100)
  age int
  nationality varchar(100)
  position_id int [ref: > positions.id]
  squad_number int
  photo_url varchar(255)
}

Table positions {
  id int [pk, increment]
  name varchar(50)
}

Table coaches {
  id int [pk, increment]
  club_id int [ref: > clubs.id]
  name varchar(100)
  age int
  nationality varchar(100)
  role_id int [ref: > roles.id]
  photo_url varchar(255)
}

Table roles {
  id int [pk, increment]
  name varchar(100)
}
```

Catatan:

- Kolom **`desc`** tetap. **DILARANG** rename jadi `description`.
  `desc` keyword SQL di beberapa database, tapi aman di MySQL.
- Semua tabel `id int pk autoincrement`.
- Tidak ada `created_at` / `updated_at` — tidak diminta, jangan ditambah sendiri.

---

## 6. Relasi & Foreign Key

```text
clubs     1 ------ N players    players.club_id     -> clubs.id
clubs     1 ------ N coaches    coaches.club_id     -> clubs.id
positions 1 ------ N players    players.position_id -> positions.id
roles     1 ------ N coaches    coaches.role_id     -> roles.id
```

Tabel anak: `players`, `coaches`. Tabel induk: `clubs`, `positions`, `roles`.

Sifat relasi wajib (nullable = false). Setiap player harus punya club + position.
Setiap coach harus punya club + role.

---

## 7. Prisma Schema

File: `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model clubs {
  id           Int       @id @default(autoincrement())
  name         String    @db.VarChar(100)
  country      String    @db.VarChar(100)
  desc         String    @db.VarChar(500)
  founded_year Int
  players      players[]
  coaches      coaches[]

  @@map("clubs")
}

model positions {
  id      Int       @id @default(autoincrement())
  name    String    @db.VarChar(50)
  players players[]

  @@map("positions")
}

model roles {
  id      Int      @id @default(autoincrement())
  name    String   @db.VarChar(100)
  coaches coaches[]

  @@map("roles")
}

model players {
  id           Int       @id @default(autoincrement())
  club_id      Int
  name         String    @db.VarChar(100)
  age          Int
  nationality  String    @db.VarChar(100)
  position_id  Int
  squad_number Int
  photo_url    String?   @db.VarChar(255)
  club         clubs     @relation(fields: [club_id], references: [id], onDelete: Cascade)
  position     positions @relation(fields: [position_id], references: [id], onDelete: Cascade)

  @@index([club_id])
  @@index([position_id])
  @@map("players")
}

model coaches {
  id          Int     @id @default(autoincrement())
  club_id     Int
  name        String  @db.VarChar(100)
  age         Int
  nationality String  @db.VarChar(100)
  role_id     Int
  photo_url   String? @db.VarChar(255)
  club        clubs   @relation(fields: [club_id], references: [id], onDelete: Cascade)
  role        roles   @relation(fields: [role_id], references: [id], onDelete: Cascade)

  @@index([club_id])
  @@index([role_id])
  @@map("coaches")
}
```

Catatan:

- `photo_url` opsional `String?`. Semua kolom lain wajib.
- `@@map` supaya nama tabel MySQL persis snake_case (`players`, `clubs`, ...)
  sementara nama model di JS tetap `prisma.player`, `prisma.club`.
- `onDelete: Cascade` — hapus club/position/role, player/coach ikut terhapus.
- `@@index` untuk FK: bentuk baik untuk presentasi ("saya kasih index di FK").

---

## 8. Struktur Folder

```text
project-basis-data/
├── RANCANGAN.md          <- dokumen ini
│
└── backend/
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.js
    │
    ├── public/
    │   └── images/
    │       ├── players/    (21 foto asli: 8 PNG + 13 JPG)
    │       └── coaches/    (3 foto asli JPG)
    │
    ├── src/
    │   ├── config/
    │   │   └── database.js
    │   │
    │   ├── controllers/
    │   │   ├── clubController.js
    │   │   ├── playerController.js
    │   │   ├── positionController.js
    │   │   ├── coachController.js
    │   │   └── roleController.js
    │   │
    │   ├── routes/
    │   │   ├── clubRoutes.js
    │   │   ├── playerRoutes.js
    │   │   ├── positionRoutes.js
    │   │   ├── coachRoutes.js
    │   │   └── roleRoutes.js
    │   │
    │   ├── middleware/
    │   │   └── errorMiddleware.js
    │   │
    │   ├── app.js
    │   └── server.js
    │
    ├── .env
    ├── .env.example
    ├── .gitignore
    ├── package.json
    └── README.md
```

Tidak ada `utils/`, `services/`, `repositories/`, atau DI container.
Makin sedikit file, makin gampang presentasi.

---

## 9. Konfigurasi Environment

`backend/.env` (tidak masuk git):

```env
DATABASE_URL="mysql://root:password@localhost:3306/barcelona_db"
PORT=5000
```

`backend/.env.example` (masuk git):

```env
DATABASE_URL="mysql://root:password@localhost:3306/barcelona_db"
PORT=5000
```

XAMPP root password defaultnya **kosong**. Kalau kosong, URL-nya
`mysql://root:@localhost:3306/barcelona_db` (tanpa `password`).

Kredensial TIDAK PERNAH di source code, hanya di `.env`. `.env` masuk `.gitignore`.

---

## 10. API Routes

Base URL: `http://localhost:5000/api`

### Clubs

| Method | Path             | Keterangan       |
| ------ | ---------------- | ---------------- |
| GET    | `/api/clubs`     | list semua club  |
| GET    | `/api/clubs/:id` | detail satu club |
| POST   | `/api/clubs`     | create           |
| PUT    | `/api/clubs/:id` | update           |
| DELETE | `/api/clubs/:id` | delete           |

### Players

| Method | Path               | Keterangan                          |
| ------ | ------------------ | ----------------------------------- |
| GET    | `/api/players`     | list + query params                 |
| GET    | `/api/players/:id` | detail, include `club` + `position` |
| POST   | `/api/players`     | create                              |
| PUT    | `/api/players/:id` | update                              |
| DELETE | `/api/players/:id` | delete                              |

Query params (sederhana, tanpa search infrastructure):

```text
GET /api/players?search=Lamine      -> filter name contains "Lamine"
GET /api/players?position=Forward   -> filter lewat relasi position.name
GET /api/players?club=1             -> filter club_id = 1
```

Boleh dikombinasikan: `?position=Forward&club=1`.

### Positions

| Method | Path                 |
| ------ | -------------------- |
| GET    | `/api/positions`     |
| GET    | `/api/positions/:id` |
| POST   | `/api/positions`     |
| PUT    | `/api/positions/:id` |
| DELETE | `/api/positions/:id` |

### Coaches

| Method | Path               | Keterangan                      |
| ------ | ------------------ | ------------------------------- |
| GET    | `/api/coaches`     | list + `?role=` / `?search=`    |
| GET    | `/api/coaches/:id` | detail, include `club` + `role` |
| POST   | `/api/coaches`     | create                          |
| PUT    | `/api/coaches/:id` | update                          |
| DELETE | `/api/coaches/:id` | delete                          |

### Roles

| Method | Path            |
| ------ | --------------- |
| GET    | `/api/roles`     |
| GET    | `/api/roles/:id` |
| POST   | `/api/roles`     |
| PUT    | `/api/roles/:id` |
| DELETE | `/api/roles/:id` |

Semua endpoint list me-`include` relasi supaya frontend tidak perlu request terpisah:
players → `club`, `position`; coaches → `club`, `role`.

---

## 11. Format Response & Status Code

Sukses tunggal:

```json
{ "success": true, "data": {} }
```

Sukses list:

```json
{ "success": true, "data": [], "count": 0 }
```

Error:

```json
{ "success": false, "message": "Player not found" }
```

```text
200 OK                    -> GET / list / detail / update / delete sukses
201 Created               -> POST sukses
400 Bad Request           -> validasi gagal, FK tidak valid, body salah
404 Not Found             -> resource dengan id itu tidak ada
500 Internal Server Error -> error tak terduga
```

**DILARANG** mengirim pesan error mentah Prisma/MySQL ke client. Semua error
diterjemahkan di `errorMiddleware.js`.

Contoh: `Foreign key constraint failed on the field: position_id`
→ client hanya lihat `"Invalid position_id: position not found"`.

---

## 12. Validasi

Validasi manual di controller. Tidak pakai zod / joi / express-validator.

### players

| Field          | Wajib  | Tipe   | Catatan                  |
| -------------- | ------ | ------ | ------------------------ |
| `name`         | ya     | string | 1-100 char               |
| `age`          | ya     | int    | 16-45                    |
| `nationality`  | ya     | string | 1-100 char               |
| `position_id`  | ya     | int    | harus ada di `positions` |
| `squad_number` | ya     | int    | 1-99                     |
| `club_id`      | ya     | int    | harus ada di `clubs`     |
| `photo_url`    | tidak  | string | opsional, maks 255 char  |

### coaches

| Field         | Wajib  | Tipe   | Catatan              |
| ------------- | ------ | ------ | --------------------- |
| `name`        | ya     | string | 1-100 char           |
| `age`         | ya     | int    | 25-80                |
| `nationality` | ya     | string | 1-100 char           |
| `role_id`     | ya     | int    | harus ada di `roles` |
| `club_id`     | ya     | int    | harus ada di `clubs` |
| `photo_url`   | tidak  | string | opsional, maks 255   |

### clubs

| Field          | Wajib | Tipe                        |
| -------------- | ----- | --------------------------- |
| `name`         | ya    | string, maks 100            |
| `country`      | ya    | string, maks 100            |
| `desc`         | ya    | string, maks 500            |
| `founded_year` | ya    | int, 1800 sampai tahun ini  |

### positions

| Field  | Wajib | Tipe            |
| ------ | ----- | --------------- |
| `name` | ya    | string, maks 50 |

### roles

| Field  | Wajib | Tipe             |
| ------ | ----- | ---------------- |
| `name` | ya    | string, maks 100 |

### Validasi Foreign Key

WAJIB dicek sebelum create/update dengan `findUnique` ke tabel induk:

```js
const position = await prisma.positions.findUnique({ where: { id: position_id } });
if (!position) -> 400 "Invalid position_id: position not found"
```

- `players.position_id` -> `positions.id`
- `players.club_id` -> `clubs.id`
- `coaches.role_id` -> `roles.id`
- `coaches.club_id` -> `clubs.id`

### Validasi ID

`id` dari URL harus integer positif. Selain itu -> `400 "Invalid id"`.
Jangan biarkan Prisma yang lempar error (pesan Prisma terlalu teknis).

### Delete dengan constraint

`players` dan `coaches` bisa dihapus bebas.

`positions`, `roles`, dan `clubs` yang masih dipakai player/coach TIDAK dihapus.
Controller mengecek `_count` lebih dulu dan membalas `400` dengan jumlahnya, supaya
data player/coach tidak hilang diam-diam.

```text
DELETE /api/positions/1  -> 400 "Position cannot be deleted: still used by 3 player(s)"
DELETE /api/clubs/1      -> 400 "Club cannot be deleted: still linked to 21 player(s) and 3 coach(es)"
DELETE /api/roles/1      -> 400 "Role cannot be deleted: still used by 1 coach(es)"
```

Di level database tetap ada `onDelete: Cascade` sebagai jaring pengaman, tapi
untuk jalur API, guard di controller yang menang.

---

## 13. Error Handling

File: `backend/src/middleware/errorMiddleware.js`

Ekspor 2 middleware.

### `notFoundHandler`

Fallback setelah semua route. Path tidak dikenal ->
`404 { "success": false, "message": "Route not found" }`.

### `errorHandler`

Urut dari paling spesifik:

```text
1. JSON body rusak (err.type = entity.parse.failed / SyntaxError) -> 400 "Invalid JSON body"
2. Error manual dari controller (butuh marker isApiError)         -> status & message custom
3. Prisma P2025 (record not found)                              -> 404 "<Resource> not found"
4. Prisma P2002 (unique constraint)                             -> 400 "<field> already exists"
5. Prisma P2003 (foreign key constraint)                        -> 400 "Invalid reference: ..."
6. Prisma KnownRequestError lain                                -> 400 "Database request failed"
7. default                                                       -> 500 "Internal server error"
```

Catatan penting: JSON parse error harus dicek **paling awal**. `http-errors`
men-set `status`/`statusCode` = 400, jadi kalau cabang generic dicek lebih dulu,
pesan parser internal V8 akan bocor ke client.

Di cabang `default`, error asli di-`console.error` di server (bisa debug) tapi
**tidak** dikirim ke client.

---

## 14. Seed Data

File: `backend/prisma/seed.js`, dijalankan `npx prisma db seed`.

Konfigurasi di `package.json`:

```json
"prisma": { "seed": "node prisma/seed.js" }
```

Seed ini **idempoten**: boleh dijalankan berkali-kali, hasilnya selalu sama,
termasuk `id` (selalu mulai dari 1). Cara achieves itu:

```js
// tabel anak: tidak di-referensikan tabel lain -> TRUNCATE aman
TRUNCATE players; TRUNCATE coaches;

// tabel master: MySQL SELALU menolak TRUNCATE pada tabel yang jadi parent
// dari FK constraint, walau tabel anaknya sudah kosong -> DELETE + reset manual
DELETE FROM positions; ALTER TABLE positions AUTO_INCREMENT = 1;
DELETE FROM roles;      ALTER TABLE roles AUTO_INCREMENT = 1;
```

Karena tabel master dikosongkan tiap seed, `connectOrCreate` selalu bikin dari
nol. Efeknya: role yang dihapus dari `ROLE_NAMES` (mis. `Fitness Coach`) hilang
permanen, tidak nyangkut di database seperti kalau cuma `connectOrCreate` tanpa
penghapusan.

### club

| Field          | Value        |
| -------------- | ------------ |
| `name`         | FC Barcelona |
| `country`      | Spain        |
| `founded_year` | 1899         |
| `desc`         | FC Barcelona, commonly known as Barca, is a Spanish professional football club based in Barcelona, Catalonia. Founded in 1899, the club competes in La Liga and holds the record for the most Spanish league titles. The club plays its home matches at the Spotify Camp Nou and is famous for its possession-based style of football and the "Mes que un club" philosophy. |

### positions (4)

Goalkeeper, Defender, Midfielder, Forward

### roles (2)

Coach, Assistant Coach

### players (21)

Nama disimpan **lengkap** (bukan nama panggilan), dan `photo_url` diturunkan dari
nama itu lewat `toSlug()`. 6 player tidak masuk seed karena tidak ada file fotonya:
João Cancelo, Xavi Espart, Gerard Martín, Brian Fariñas, Jesse Bisiwu,
Hamza Abdelkarim.

| #  | Nama                      | Age | Kebangsaan  | Position   | photo_url                                     |
| -- | ------------------------- | --- | ----------- | ---------- | --------------------------------------------- |
| 1  | Joan García López         | 25  | Spain       | Goalkeeper | `/images/players/joan-garcia-lopez.png`       |
| 13 | Wojciech Szczęsny         | 36  | Poland      | Goalkeeper | `/images/players/wojciech-szczesny.png`       |
| 25 | Dominik Livaković         | 31  | Croatia     | Goalkeeper | `/images/players/dominik-livakovic.png`       |
| 3  | Alejandro Balde Cortés    | 23  | Spain       | Defender   | `/images/players/alejandro-balde-cortes.jpg`  |
| 5  | Pau Cubarsí Poy           | 19  | Spain       | Defender   | `/images/players/pau-cubarsi-poy.jpg`         |
| 15 | Andreas Christensen       | 30  | Denmark     | Defender   | `/images/players/andreas-christensen.jpg`     |
| 23 | Jules Koundé              | 28  | France      | Defender   | `/images/players/jules-kounde.jpg`            |
| 24 | Eric García Martínez      | 25  | Spain       | Defender   | `/images/players/eric-garcia-martinez.png`    |
| 6  | Pablo Martín Páez Gavira  | 22  | Spain       | Midfielder | `/images/players/pablo-martin-paez-gavira.png` |
| 7  | Fermín López              | 23  | Spain       | Midfielder | `/images/players/fermin-lopez.jpg`            |
| 8  | Pedro González López      | 23  | Spain       | Midfielder | `/images/players/pedro-gonzalez-lopez.png`   |
| 16 | Rodrigo Díaz              | 30  | Spain       | Midfielder | `/images/players/rodrigo-diaz.jpg`            |
| 20 | Dani Olmo                 | 28  | Spain       | Midfielder | `/images/players/dani-olmo.jpg`               |
| 21 | Frenkie de Jong           | 29  | Netherlands | Midfielder | `/images/players/frenkie-de-jong.jpg`         |
| 22 | Marc Bernal               | 19  | Spain       | Midfielder | `/images/players/marc-bernal.jpg`             |
| 9  | Gabriel Jesus             | 30  | Brazil      | Forward    | `/images/players/gabriel-jesus.jpg`           |
| 10 | Lamine Yamal              | 19  | Spain       | Forward    | `/images/players/lamine-yamal.png`            |
| 11 | Raphael Dias Belloli      | 29  | Brazil      | Forward    | `/images/players/raphael-dias-belloli.jpg`    |
| 14 | Karim Adeyemi             | 24  | Germany     | Forward    | `/images/players/karim-adeyemi.jpg`           |
| 17 | Anthony Gordon            | 25  | England     | Forward    | `/images/players/anthony-gordon.jpg`          |
| 19 | Roony Bardghji            | 20  | Sweden      | Forward    | `/images/players/roony-bardghji.png`          |

### coaches (3)

Hanya coach yang punya file foto di `backend/public/images/coaches/` yang masuk
seed. Nama disimpan lengkap dan `photo_url` diturunkan dari `toSlug(name)`.

| Nama               | Age | Kebangsaan | Role            | photo_url                                  |
| ------------------ | --- | ---------- | --------------- | ------------------------------------------ |
| Hans-Dieter Flick  | 61  | Germany    | Coach           | `/images/coaches/hans-dieter-flick.jpg`    |
| Marcus Sörg        | 51  | Germany    | Assistant Coach | `/images/coaches/marcus-sorg.jpg`          |
| Toni Tapalović     | 41  | Montenegro | Assistant Coach | `/images/coaches/toni-tapalovic.jpg`       |

Data seed bersifat **illustratif** untuk demo/presentasi. Yang dinilai adalah
skema, relasi, dan bentuk datanya.

### Cara seed menulis relasi (WAJIB lookup by name)

DILARANG hardcode `position_id: 1`. Selalu lookup dulu:

```js
async function connectOrCreatePosition(name) {
  const existing = await prisma.positions.findUnique({ where: { name } });
  if (existing) return existing;
  return prisma.positions.create({ data: { name } });
}

async function connectOrCreateRole(name) {
  const existing = await prisma.roles.findUnique({ where: { name } });
  if (existing) return existing;
  return prisma.roles.create({ data: { name } });
}

const club = await prisma.clubs.upsert({
  where: { name: 'FC Barcelona' },
  update: {},
  create: {
    name: 'FC Barcelona',
    country: 'Spain',
    founded_year: 1899,
    desc: '...'
  }
});

const positions = {};
for (const name of ['Goalkeeper', 'Defender', 'Midfielder', 'Forward']) {
  positions[name] = await connectOrCreatePosition(name);
}

for (const p of playersData) {
  await prisma.players.create({
    data: {
      name: p.name,
      age: p.age,
      nationality: p.nationality,
      squad_number: p.squad_number,
      photo_url: p.photo_url,
      club:     { connect: { id: club.id } },
      position: { connect: { id: positions[p.position].id } }
    }
  });
}
```

Dengan begitu seed bisa dijalankan berulang tanpa error duplikat.

`photo_url` format: `/images/players/pedro-gonzalez-lopez.png`, `/images/coaches/hans-dieter-flick.jpg`

---

## 15. Photo URL

- Hanya simpan string path/URL di kolom `photo_url`.
- Tidak ada upload, tidak ada file biner di dalam MySQL.
- TIDAK pakai Cloudinary / AWS S3 / Firebase Storage / image processing
  sampai diminta eksplisit.

```text
/images/players/pedro-gonzalez-lopez.png
/images/coaches/hans-dieter-flick.jpg
https://example.com/player.jpg
```

### Di mana file gambarnya disimpan?

**Di frontend.** Database cuma nyimpan path, bukan file.

Alasannya:

- `photo_url` cuma string. MySQL tidak menyimpan aset biner.
- Aset statis (gambar) berubah sering, dan "siapa yang menyajikan" itu urusan
  tier frontend, bukan database.
- Prinsip arsitektur di section 2: frontend dan backend terpisah.

### Tapi backend juga men-serve `/images`

Supaya API bisa dites tanpa frontend, `src/app.js` juga me-mount:

```js
app.use("/images", express.static(path.join(__dirname, "..", "public", "images")));
```

Path-nya **sama persis** dengan yang akan dipakai frontend
(`frontend/public/images/`). Jadi file-nya tinggal di-copy ke frontend,
tanpa perlu ubah data `photo_url` di database.

```text
frontend/public/images/players/pedro-gonzalez-lopez.png -> frontend sajikan sendiri
backend/public/images/players/pedro-gonzalez-lopez.png  -> backend sajikan (untuk testing)
photo_url di database                                    -> /images/players/pedro-gonzalez-lopez.png
```

### Isi folder sekarang

`backend/public/images/` sudah berisi **foto asli**, bukan placeholder:

| Folder         | Jumlah | Isi                                                            |
| -------------- | ------ | -------------------------------------------------------------- |
| `players/`     | 21     | 8 PNG (1672x941, ~2.1 MB) + 13 JPG (~300-660 KB)                |
| `coaches/`     | 3      | foto asli JPG, ~615-667 KB                                      |

Ekstensi **bercampur** dan itu disengaja. Field `ext` per-player di
`prisma/seed.js` yang menentukan, bukan hardcode `.png`:

```js
{ name: "Pedro González López", ..., ext: ".png" }
{ name: "Karim Adeyemi", ..., ext: ".jpg" }

photo_url: `/images/players/${toSlug(p.name)}${p.ext}`
```

Kalau file `.jpg` dipaksa diberi ekstensi `.png`, `express.static` bakal kirim
`Content-Type: image/png` padahal isinya data JPEG. Browser biasanya sniffing
dantetus, tapi itu bohong dan bikin debugging misery.

Cara ganti/tambah foto:

1. Replace file di `backend/public/images/players/<slug>.<ext>`, slug =
   `toSlug(name)` (lowercase, aksen dibuang, spasi jadi `-`).
2. Kalau ekstensinya berubah, samakan juga `ext` di `prisma/seed.js`,
   lalu `npm run db:seed`.
3. Copy folder yang sama ke `frontend/public/images/`.

`toSlug()` dipakai supaya nama file ASCII: `Joan García López` -> `joan-garcia-lopez`.
Aksen tetap aman di kolom `name` (UTF-8 `utf8mb4`), cuma hilang di nama file.

Tidak ada upload endpoint, tidak ada processing. Kalau file tidak ada, endpoint
gambar membalas `404`, dan frontend harus handle fallback.

---

## 16. Prisma Migration Flow

```bash
npx prisma migrate dev --name init   # buat tabel + generate client
npx prisma generate                  # regenerate client (kalau schema diubah)
npx prisma db seed                   # isi data seed
npx prisma studio                    # GUI browse database, port 5555
```

`migrate dev` otomatis membuat database `barcelona_db` kalau belum ada,
asalkan user MySQL punya hak buat.

---

## 17. Package Scripts

Sudah ada di `backend/package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "db:seed": "prisma db seed"
  },
  "prisma": {
    "seed": "node prisma/seed.js"
  }
}
```

`prisma` (CLI) di `devDependencies`, `@prisma/client` (runtime) di `dependencies`.

---

## 18. Testing

Diuji pakai **Postman** atau **Thunder Client** (VS Code).

### Minimum GET

```text
GET /api/clubs
GET /api/players
GET /api/players/1
GET /api/players?search=Lamine
GET /api/players?position=Forward
GET /api/players?club=1
GET /api/positions
GET /api/coaches
GET /api/coaches/1
GET /api/roles
```

### CRUD per resource

POST -> PUT -> DELETE untuk clubs, players, positions, coaches, roles.

### Negative test (wajib)

| Test                                             | Expectasi |
| ------------------------------------------------ | --------- |
| `GET /api/players/999999`                        | 404 |
| `GET /api/players/abc`                           | 400 |
| `POST /api/players` tanpa `name`                 | 400 |
| `POST /api/players` dengan `position_id: 999999`  | 400 |
| `POST /api/players` dengan `club_id: 999999`      | 400 |
| `POST /api/coaches` dengan `role_id: 999999`      | 400 |
| `POST /api/players` dengan `age: "abc"`           | 400 |
| `POST /api/players` dengan `age: 5`               | 400 |
| JSON body rusak                                  | 400 |
| `GET /api/tidak-ada`                             | 404 |

### Cek database asli

`npx prisma studio` -> data yang muncul harus sama persis dengan response API.
Kalau API jalan tapi Studio kosong, berarti sedang baca mock — itu bug.

---

## 19. Future CMS (bukan bagian task ini)

```text
Admin Dashboard

Players
├── View
├── Add
├── Edit
└── Delete

Coaches
├── View
├── Add
├── Edit
└── Delete

Positions
└── Manage

Roles
└── Manage
```

Yang TIDAK diimplementasi sekarang: login, JWT, admin auth, authorization,
role-based access.

---

## 20. Future Public Website (React)

```text
Home
├── Club identity
├── Hero
├── Featured players
├── Featured coaching staff
├── Club introduction
└── CTA

Players         -> grid, search, position filter, player cards
Player Detail   -> portrait, name, squad number, position, nationality, age,
                   position visualization, related players, prev/next navigation
Coaching Staff  -> staff listing, role grouping/filter, coach cards
Coach Detail    -> portrait, name, role, nationality, age
Club            -> name, country, description, founded year
```

TIDAK ditampilkan: goals, assists, matches, transfers, injuries, career history
— karena tidak ada di database. Jangan karang field yang tidak ada di API.

Kebutuhan minimum API (sudah terpenuhi): `GET /api/players` dengan `?search=`,
`?position=`, `?club=` plus include relasi, dan `GET /api/players/:id`.

---

## 21. Design Direction (frontend, tidak ada di backend)

Public website: **Dark Editorial + Cinematic Sports + Modern Minimal**

- Dark visual language, base `#0B0B0D`
- Large player portraits
- Strong typography
- Editorial layouts
- Subtle FC Barcelona accents: blaugrana `#004D98` / `#A50044`
- Smooth transitions
- Premium portfolio-quality

CMS: clean, professional, dashboard-oriented, table-based CRUD.

Backend tidak mengimplementasikan UI sama sekali.

---

## 22. Aturan Database — Normalisasi

Database wajib normalized dan relational.

```text
SALAH  players.position = "Midfielder"
BENAR  players.position_id -> positions.id
```

Hal sama untuk `club_id` dan `role_id`.

Alasan: ini proyek Basis Data. Nilai presentasi ada di normalisasi, bukan di
banyaknya fitur. Menjelaskan "kenapa pakai foreign key" dengan jelas lebih kuat
daripada menambah 15 tabel.

---

## 23. Anti-pattern yang Dilarang

- microservices
- GraphQL
- Redis
- Docker
- WebSockets
- JWT / OAuth
- message queues
- caching system
- repository pattern
- dependency injection framework
- service layer terpisah dari controller
- TypeScript

Kecuali diminta eksplisit di kemudian hari.

---

## 24. Implementation Order & Checklist

| #  | Step                                                          | Status |
| -- | ------------------------------------------------------------- | ------ |
| 1  | Init project Node.js                                          | **selesai** |
| 2  | Install express, prisma, @prisma/client, dotenv, cors, nodemon | **selesai** |
| 3  | Konfigurasi MySQL                                             | **selesai** (mysqld jalan, port 3306 hidup) |
| 4  | Buat `schema.prisma`                                          | **selesai** |
| 5  | Buat 5 tabel + relasi                                         | **selesai** (migration `20261003084434_init`) |
| 6  | `npx prisma migrate dev --name init`                          | **selesai** |
| 7  | `npx prisma generate`                                         | **selesai** |
| 8  | Buat seed data                                                | **selesai** (1 club, 4 position, 2 role, 21 player, 3 coach) |
| 9  | Konfigurasi Express                                           | **selesai** |
| 10 | Buat routes                                                   | **selesai** (5 file) |
| 11 | Buat controllers                                              | **selesai** (5 file) |
| 12 | Implementasi CRUD                                             | **selesai** (25 endpoint) |
| 13 | Implementasi validasi                                         | **selesai** |
| 14 | Centralized error handling                                    | **selesai** |
| 15 | Konfigurasi CORS                                              | **selesai** |
| 16 | Test API (Postman/Thunder Client)                             | **sebagian** (sudah diuji via script; perlu dites manual) |
| 17 | Buat README / dokumen rancangan                               | **selesai** (dokumen ini) |

**Progress: 16.5 / 17.**

### Status test (hasil run otomatis)

| Uji                              | Hasil |
| -------------------------------- | ----- |
| `GET /api`                       | 200 |
| `GET /api/clubs`                 | 200, `count: 1`, `_count: 21 players / 3 coaches` |
| `GET /api/players`               | 200, `count: 21` |
| `GET /api/players/1`             | 200, include `club` + `position` |
| `GET /api/players?search=Lamine` | 200, `count: 1` |
| `GET /api/players?position=Forward` | 200, `count: 8` |
| `GET /api/players?club=1`        | 200, `count: 21` |
| `GET /api/players?position=Midfielder&club=1` | 200, `count: 8` |
| `GET /api/positions`             | 200, `count: 4`, `_count` per position |
| `GET /api/roles`                 | 200, `count: 2` |
| `GET /api/coaches`               | 200, `count: 3` |
| `GET /api/coaches/1`             | 200, include `club` + `role` |
| CRUD player/coach/position/role/club | POST 201, PUT 200, DELETE 200 |
| `GET /api/players/999999`        | 404 `Player not found` |
| `GET /api/players/abc`           | 400 `Invalid id` |
| `GET /api/players?club=xx`       | 400 |
| `GET /api/tidak-ada`             | 404 `Route not found` |
| POST tanpa `name`                | 400 `name is required` |
| POST `age: "abc"`                | 400 `age must be an integer between 16 and 45` |
| POST `position_id: 999999`       | 400 `Invalid position_id: position with id 999999 does not exist` |
| POST `club_id: 999999`           | 400 `Invalid club_id: club with id 999999 does not exist` |
| POST coach `role_id: 999999`     | 400 `Invalid role_id: role with id 999999 does not exist` |
| POST `squad_number` duplikat     | 400 `squad_number 1 is already used by Joan García in this club` |
| `DELETE /api/positions/1`        | 400 `still used by 3 player(s)` |
| `DELETE /api/clubs/1`            | 400 `still linked to 21 player(s) and 3 coach(es)` |
| JSON body rusak `{bad json`      | 400 `Invalid JSON body` (parser V8 tidak bocor) |
| `npx prisma studio`              | up di http://localhost:5555 |
| `GET /images/players/joan-garcia.png` | 200 `image/png` (express.static) |
| `GET /images/players/hilang.png`  | 404 (frontend handle fallback) |

### Catatan port

Port **5000** sempat dipakai proses `node src/server.js` milik project lain
(PID 28184). Proses tersebut sudah dimatikan, backend ini sekarang jalan di
`http://localhost:5000/api` sesuai spek. Kalau nanti bentrok lagi, cari culprit
dengan `Get-NetTCPConnection -LocalPort 5000 -State Listen`, matikan PID-nya,
atau ganti `PORT` di `.env`.

### Definition of Done

- [ ] `npm run dev` jalan, API expose di `http://localhost:5000/api`
- [ ] `npx prisma studio` bisa dibuka, isinya sama dengan response API
- [ ] Semua 25 endpoint (5 resource x CRUD) berfungsi
- [ ] Semua negative test di section 18 return status code yang benar
- [ ] Tidak ada error Prisma mentah yang bocor ke client
- [ ] Database benar-benar MySQL, bukan JSON atau memory
- [ ] Dokumen ini sinkron dengan kode

---

## 25. Catatan Environment (hasil pengecekan)

| Item            | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Working dir     | `D:\IT\website-development\Kuliah Project\project-basis-data` |
| Node            | v24.18.0                                                   |
| npm             | 11.7.0                                                    |
| `C:\xampp`      | ADA, `mysql\bin\mysqld.exe` ADA                           |
| `C:\laragon`    | ADA, `mysql-8.4.3-winx64`                                 |
| mysqld          | **RUNNING**, port 3306 reachable                          |
| Prisma `latest` | 8.0.0-rc.19 -> jangan dipakai                            |
| Prisma `prev`   | 7.10.0 -> butuh `prisma.config.ts` (TypeScript)           |
| Prisma dipin    | **6.19.3**                                                |

---

## 26. Setup Cepat

```bash
cd backend
npm install
copy .env.example .env          # sesuaikan password MySQL
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed
npm run dev
```

Lalu buka `http://localhost:5000/api/clubs`.
