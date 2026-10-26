

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const POSITION_NAMES = ["Goalkeeper", "Defender", "Midfielder", "Forward"];
const ROLE_NAMES = ["Coach", "Assistant Coach"];

const CLUB = {
  name: "FC Barcelona",
  country: "Spain",
  founded_year: 1899,
  desc: "FC Barcelona, commonly known as Barca, is a Spanish professi`onal football club based in Barcelona, Catalonia. Founded in 1899, the club competes in La Liga and holds the record for the most Spanish league titles. The club plays its home matches at the Spotify Camp Nou and is famous for its possession-based style of football and the Mes que un club philosophy."
};

const PLAYERS = [
  { name: "Joan García López", age: 25, nationality: "Spain", position: "Goalkeeper", squad_number: 1, ext: ".png" },
  { name: "Wojciech Szczęsny", age: 36, nationality: "Poland", position: "Goalkeeper", squad_number: 13, ext: ".png" },
  { name: "Dominik Livaković", age: 31, nationality: "Croatia", position: "Goalkeeper", squad_number: 25, ext: ".png" },

  { name: "Alejandro Balde Cortés", age: 23, nationality: "Spain", position: "Defender", squad_number: 3, ext: ".jpg" },
  { name: "Pau Cubarsí Poy", age: 19, nationality: "Spain", position: "Defender", squad_number: 5, ext: ".jpg" },
  { name: "Andreas Christensen", age: 30, nationality: "Denmark", position: "Defender", squad_number: 15, ext: ".jpg" },
  { name: "Jules Koundé", age: 28, nationality: "France", position: "Defender", squad_number: 23, ext: ".jpg" },
  { name: "Eric García Martínez", age: 25, nationality: "Spain", position: "Defender", squad_number: 24, ext: ".png" },

  { name: "Pablo Martín Páez Gavira", age: 22, nationality: "Spain", position: "Midfielder", squad_number: 6, ext: ".png" },
  { name: "Fermín López", age: 23, nationality: "Spain", position: "Midfielder", squad_number: 7, ext: ".jpg" },
  { name: "Pedro González López", age: 23, nationality: "Spain", position: "Midfielder", squad_number: 8, ext: ".png" },
  { name: "Rodrigo Díaz", age: 30, nationality: "Spain", position: "Midfielder", squad_number: 16, ext: ".jpg" },
  { name: "Dani Olmo", age: 28, nationality: "Spain", position: "Midfielder", squad_number: 20, ext: ".jpg" },
  { name: "Frenkie de Jong", age: 29, nationality: "Netherlands", position: "Midfielder", squad_number: 21, ext: ".jpg" },
  { name: "Marc Bernal", age: 19, nationality: "Spain", position: "Midfielder", squad_number: 22, ext: ".jpg" },

  { name: "Gabriel Jesus", age: 30, nationality: "Brazil", position: "Forward", squad_number: 9, ext: ".jpg" },
  { name: "Lamine Yamal", age: 19, nationality: "Spain", position: "Forward", squad_number: 10, ext: ".png" },
  { name: "Raphael Dias Belloli", age: 29, nationality: "Brazil", position: "Forward", squad_number: 11, ext: ".jpg" },
  { name: "Karim Adeyemi", age: 24, nationality: "Germany", position: "Forward", squad_number: 14, ext: ".jpg" },
  { name: "Anthony Gordon", age: 25, nationality: "England", position: "Forward", squad_number: 17, ext: ".jpg" },
  { name: "Roony Bardghji", age: 20, nationality: "Sweden", position: "Forward", squad_number: 19, ext: ".png" }
];

const COACHES = [
  { name: "Hans-Dieter Flick", age: 61, nationality: "Germany", role: "Coach", ext: ".jpg" },
  { name: "Marcus Sörg", age: 51, nationality: "Germany", role: "Assistant Coach", ext: ".jpg" },
  { name: "Toni Tapalović", age: 41, nationality: "Montenegro", role: "Assistant Coach", ext: ".jpg" }
];

function toSlug(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function connectOrCreatePosition(name) {
  const existing = await prisma.positions.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.positions.create({ data: { name } });
}

async function connectOrCreateRole(name) {
  const existing = await prisma.roles.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.roles.create({ data: { name } });
}

async function upsertClub(data) {
  const existing = await prisma.clubs.findFirst({ where: { name: data.name } });
  if (existing) {
    return prisma.clubs.update({
      where: { id: existing.id },
      data: { country: data.country, founded_year: data.founded_year, desc: data.desc }
    });
  }
  return prisma.clubs.create({ data });
}

async function main() {

  const club = await upsertClub({
    name: CLUB.name,
    country: CLUB.country,
    founded_year: CLUB.founded_year,
    desc: CLUB.desc
  });

  await prisma.$executeRawUnsafe("TRUNCATE TABLE `players`");
  await prisma.$executeRawUnsafe("TRUNCATE TABLE `coaches`");

  for (const table of ["positions", "roles"]) {
    await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\``);
    await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
  }

  const positions = {};
  for (const name of POSITION_NAMES) {
    positions[name] = await connectOrCreatePosition(name);
  }

  const roles = {};
  for (const name of ROLE_NAMES) {
    roles[name] = await connectOrCreateRole(name);
  }

  for (const p of PLAYERS) {
    await prisma.players.create({
      data: {
        name: p.name,
        age: p.age,
        nationality: p.nationality,
        squad_number: p.squad_number,
        photo_url: `/images/players/${toSlug(p.name)}${p.ext}`,
        club: { connect: { id: club.id } },
        position: { connect: { id: positions[p.position].id } }
      }
    });
  }

  for (const c of COACHES) {
    await prisma.coaches.create({
      data: {
        name: c.name,
        age: c.age,
        nationality: c.nationality,
        photo_url: `/images/coaches/${toSlug(c.name)}${c.ext}`,
        club: { connect: { id: club.id } },
        role: { connect: { id: roles[c.role].id } }
      }
    });
  }

  const counts = {
    clubs: await prisma.clubs.count(),
    positions: await prisma.positions.count(),
    roles: await prisma.roles.count(),
    players: await prisma.players.count(),
    coaches: await prisma.coaches.count()
  };

  console.log("Seed selesai.");
  console.table(counts);
}

main()
  .catch((error) => {
    console.error("Seed gagal:", error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
