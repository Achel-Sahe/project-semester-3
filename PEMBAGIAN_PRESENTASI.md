# 🎤 Pembagian Part Presentasi UAS — FC Barcelona Squad Information System

**Matkul:** Basis Data
**Anggota:** 5 orang
**Fokus utama:** DB (ERD, relasi, FK, normalisasi) — bukan kode FE/BE

---

## Alur Presentasi

```
Orang 1 → Pembuka + Gambaran Umum           (2-3 menit)
Orang 2 → Arsitektur + Tech Stack + FE/BE   (3-4 menit)
Orang 3 → ERD + Normalisasi                 (5-7 menit) ⭐
Orang 4 → Relasi, FK, Index, CASCADE        (5-7 menit) ⭐
Orang 5 → Alur Kerja Sistem + Penutup       (3-4 menit)
```

> ⭐ = part terpenting, paling dinilai dosen DB

---

## 👤 Orang 1 — Pembuka & Gambaran Umum

**Yang disampaikan:**
- Perkenalan tim & nama proyek: *"FC Barcelona Squad Information System"*
- Latar belakang: kenapa sistem ini dibuat, untuk apa
- Fitur utama: tampilkan data pemain, pelatih, dan info klub FC Barcelona
- Lingkup data: 1 klub, 21 pemain, 3 pelatih

**Kalimat kunci:**
> *"Sistem ini adalah platform informasi skuad FC Barcelona yang memungkinkan pengguna melihat data pemain dan pelatih secara lengkap, dibangun di atas database MySQL yang terstruktur."*

---

## 👤 Orang 2 — Arsitektur, Tech Stack & Peran FE/BE

**Yang disampaikan:**
- Diagram arsitektur: `React → Express → Prisma → MySQL`
- Sebutkan tech stack — **singkat, tidak perlu detail kode**
- Peran: FE menampilkan data, BE menyediakan API, tidak konek langsung ke DB
- Tekankan: *"Frontend dan backend terpisah, komunikasi hanya via HTTP REST API"*

**Tech Stack:**

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| ORM | Prisma 6.19.3 |
| Database | MySQL |

---

## 👤 Orang 3 — ERD & Normalisasi ⭐

**Yang disampaikan:**
- Tunjukkan diagram ERD
- Jelaskan 5 tabel: `clubs`, `players`, `coaches`, `positions`, `roles`
- Jelaskan kenapa `positions` & `roles` dipisah → **normalisasi** (hindari data duplikat)

**Poin normalisasi:**
> *"Tabel `positions` dipisah supaya tidak ada redundansi. Kalau nama posisi ingin diubah, cukup update 1 baris di tabel `positions`, bukan update semua baris di `players`."*

**5 Tabel:**
```
clubs      → id, name, country, desc, founded_year
players    → id, club_id (FK), position_id (FK), name, age, nationality, squad_number, photo_url
coaches    → id, club_id (FK), role_id (FK), name, age, nationality, photo_url
positions  → id, name
roles      → id, name
```

---

## 👤 Orang 4 — Relasi, FK, Index & ON DELETE CASCADE ⭐

**Yang disampaikan:**

**4 Relasi:**
```
clubs     1 ──── N  players   (players.club_id → clubs.id)
clubs     1 ──── N  coaches   (coaches.club_id → clubs.id)
positions 1 ──── N  players   (players.position_id → positions.id)
roles     1 ──── N  coaches   (coaches.role_id → roles.id)
```

**Kenapa semua 1:N, bukan M:N?**
> *"Satu pemain hanya bermain untuk 1 klub di satu waktu → cukup 1:N. Kalau ada transfer history (1 pemain pernah di banyak klub), baru butuh tabel junction → M:N."*

**ON DELETE CASCADE:**
> *"Kalau klub dihapus, semua 21 pemain dan pelatih yang terhubung ikut terhapus otomatis di level database."*

**Index di FK:**
> *"Kita tambahkan `@@index` di kolom FK seperti `club_id` dan `position_id` untuk mempercepat query JOIN dan WHERE."*

---

## 👤 Orang 5 — Alur Kerja Sistem & Penutup

**Yang disampaikan:**
- Tunjukkan alur request-response secara singkat
- Contoh konkret:
  > *"User buka halaman Players → React fetch `GET /api/players?position=Forward` → Express query via Prisma → MySQL kembalikan data → ditampilkan di UI"*
- Migrasi Prisma (singkat): `schema.prisma → migration.sql → database`
- Penutup & siap tanya jawab

**Alur request:**
```
User → React (FE) → GET /api/players → Express (BE) → Prisma ORM → MySQL
                                                                        ↓
User ← React (FE) ← { data: [...] } ← Express (BE) ← Prisma ORM ← rows
```

---

## 📌 Tips Q&A

Dosen DB biasanya tanya:
1. **Apa beda PRIMARY KEY dan UNIQUE KEY?**
2. **Apa yang terjadi kalau club dihapus?** (jawab: CASCADE)
3. **Kenapa relasi 1:N, kapan jadi M:N?**
4. **Kenapa ada index di FK?**
5. **Apa itu Prisma migration?**

→ Semua jawaban sudah ada di `PERTANYAAN_SIDANG.md` — baca sebelum presentasi!
