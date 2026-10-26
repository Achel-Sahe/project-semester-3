# Pertanyaan Buat Kelompok Lain — Sidang Basis Data

Universal, bisa dipakai buat proyek basis data mana pun. Dari gampang sampai bikin mikir.

## Pemanasan (wajib mereka bisa)
1. Jelaskan ERD kamu — berapa tabel, berapa relasi, jenis relasinya apa aja?
2. Apa fungsi aplikasi kamu, dan kenapa butuh database?
3. Apa itu PK, FK, dan UNIQUE? Sebutkan contohnya di schema kamu.
4. Kenapa kolom ini `NOT NULL`, yang itu boleh `NULL`?

## Normalisasi (favorite dosen)
5. Skema kamu normalisasi ke bentuk keberapa? Buktikan.
6. Tunjuk satu tabel yang kalau gak dinormalisasi bakal ada **redundancy** — contohnya gimana?
7. Kapan boleh "melanggar" normalisasi demi kemudahan? (denormalization)

## Relasi & Constraint
8. Ada relasi M:N di project kamu? Kalau ada, tunjuk tabel junction-nya. Kalau gak ada, kasih contoh fitur yang bakal bikin relasi jadi M:N.
9. Kalau parent row dihapus, child-nya gimana? Kenapa pilih `CASCADE`/`RESTRICT`/`SET NULL` itu?
10. Apa constraint unik yang ada di project kamu? Kenapa butuh itu?

## SQL (bisa langsung disuruh praktik)
11. Tulis SQL buat ambil data dari 2 tabel (JOIN) sesuai fitur project kamu.
12. Kalau mau hitung "berapa item per kategori", pakai query apa? (GROUP BY + COUNT)
13. Tunjukkan query yang pakai `WHERE`, `ORDER BY`, dan `LIMIT` sekaligus.

## Indexing & Performance
14. Kolom mana yang sering dipakai buat filter/cari? Udah di-index belum?
15. Kalau data naik 1 juta baris, query kamu masih cepat? Kenapa?

## Transaksi (buat yang pakai CRUD berulang)
16. Apa itu transaksi & ACID? Kasih contoh di project kamu yang **harusnya** pakai transaksi.
17. Gimana kalau di tengah operasi listrik mati / error — data kamu aman?

## Desain (paling bikin debat)
18. Kalau besok ada fitur baru [X], schema harus diubah apa? (umumnya: nambah tabel atau kolom)
19. Kenapa kolom ini `INT`/`VARCHAR(n)`? Panjangnya dari mana?
20. Kalau kamu jadi dosen, nilai schema kamu berapa? Apa kelemahannya?

## Trick question (bonus, buat yang mau jago)
21. "Kenapa gak pakai satu tabel besar aja, biar gampang?" — jawab: redundansi + anomali.
22. "Kolom `name` kok gak diberi `UNIQUE`?" — bisa jadi bener, bisa jadi salah, terserah mereka defend.
23. "Kenapa gak pakai Excel?" — jawab: konkurensi, integritas, skala.

---

Tips pas sidang:
- **Tanya 2-3 aja**, jangan semua — cukup: 1 ERD, 1 SQL, 1 "kalau fitur X ditambah gimana"
- Kalau mereka jawab ke poin 18 dengan cepat → berarti bener2 ngerti skemanya
