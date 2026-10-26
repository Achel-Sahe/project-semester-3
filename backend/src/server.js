require("dotenv").config();

const app = require("./app");
const prisma = require("./config/database");

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  try {

    await prisma.$connect();
    console.log("Database terhubung.");

    const server = app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
      console.log(`Base API: http://localhost:${PORT}/api`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} sudah dipakai. Ganti PORT di file .env.`);
      } else {
        console.error("Gagal menjalankan server:", error.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Koneksi database gagal:", error.message);
    console.error("Cek DATABASE_URL di file .env, lalu pastikan MySQL sudah jalan.");
    process.exit(1);
  }
}

start();
