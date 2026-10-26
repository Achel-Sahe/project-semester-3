# Pertanyaan & Jawaban — Sidang Basis Data

**Project:** FC Barcelona Squad Information System
**Stack:** MySQL + Prisma 6.19.3 + Express + React
**Skema:** 5 tabel (`clubs`, `players`, `coaches`, `positions`, `roles`), semua relasi 1:N

---

## 1. Apa beda PRIMARY KEY dan UNIQUE KEY?

| | PRIMARY KEY | UNIQUE KEY |
|---|---|---|
| Boleh NULL? | ❌ Tidak | ✅ Boleh (default) |
| Per tabel | Cuma **1** | Boleh **banyak** |
| Fungsi | Identifikasi baris | Batasi nilai duplikat |

**Contoh di schema:** `clubs.id` = PK (setiap club beda, wajib ada). `squad_number` di `players` = UNIQUE gabungan dengan `club_id` — nomor punggung boleh sama antar club, tapi tidak dalam 1 club.

---

## 2. Apa itu FOREIGN KEY? Apa yang terjadi kalau kamu hapus club yang masih punya 21 players?

FK = kolom yang **nunjuk ke PK tabel lain**, jaga integritas referensi (gak ada "zombie data").

Kalau kamu hapus club yang punya 21 players:

- Schema kamu pakai `ON DELETE CASCADE` → **21 players ikut kehapus otomatis**.
- Kalau tanpa CASCADE → MySQL **tolak** hapusnya (error "row is referenced").

---

## 3. Kenapa relasi club→player dipilih 1:N, bukan M:N? Kapan sebuah relasi jadi M:N?

- 1 club → banyak players ✓
- 1 player → 1 club pada satu waktu ✓
- Makanya 1:N, cukup FK `club_id` di `players`.

Jadi **M/N** kalau misalnya ada tabel *transfer history* — 1 pemain pernah di banyak club, 1 club pernah punya banyak pemain → butuh **tabel junction** (misal `transfers`: `player_id` + `club_id` + tanggal).

---

## 4. Kenapa tambah `@@index` manual di kolom FK? Padahal MySQL otomatis bikin index untuk FK, kan?

Sebenernya **InnoDB (MySQL) emang auto-bikin index buat FK**. Tapi tetap ditulis eksplisit karena:

1. **Eksplisit = dokumentasi** — orang langsung tahu kolom itu sering dipakai JOIN/WHERE.
2. **Deterministik** — migration Prisma selalu konsisten, gak tergantung behavior DB.
3. **Portabel** — ada DB yang gak auto-index FK (misal PostgreSQL).

---

## 5. Prisma migration itu apa? Jelaskan alur schema.prisma → migration.sql → database.

```
schema.prisma        ← "cetak biru" (sumber kebenaran)
   ↓  prisma migrate dev
migration.sql        ← file SQL mentah (DDL), di-version di folder migrations/
   ↓  dijalankan ke MySQL
database             ← tabel kebentuk
```

Ringkasnya: **schema.prisma** kamu ubah → Prisma bikin **file SQL otomatis** → file itu dijalankan ke **database**. Tiap tim punya history migrasi yang sama, jadi schema semua orang identik.
