const prisma = require("../config/database");

async function getClubs(req, res, next) {
  try {
    const clubs = await prisma.clubs.findMany({
      orderBy: { id: "asc" },
      include: {
        _count: { select: { players: true, coaches: true } }
      }
    });

    return res.status(200).json({
      success: true,
      data: clubs,
      count: clubs.length
    });
  } catch (error) {
    next(error);
  }
}

async function getClubById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const club = await prisma.clubs.findUnique({ where: { id } });
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }

    return res.status(200).json({
      success: true,
      data: club
    });
  } catch (error) {
    next(error);
  }
}

async function createClub(req, res, next) {
  try {
    const body = req.body || {};

    const invalid = validateClub(body, true);
    if (invalid) {
      return res.status(400).json({ success: false, message: invalid });
    }

    const club = await prisma.clubs.create({
      data: {
        name: body.name.trim(),
        country: body.country.trim(),
        desc: body.desc.trim(),
        founded_year: body.founded_year
      }
    });

    return res.status(201).json({
      success: true,
      data: club
    });
  } catch (error) {
    next(error);
  }
}

async function updateClub(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const existing = await prisma.clubs.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }

    const body = req.body || {};

    const invalid = validateClub(body, false);
    if (invalid) {
      return res.status(400).json({ success: false, message: invalid });
    }

    const data = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.country !== undefined) data.country = body.country.trim();
    if (body.desc !== undefined) data.desc = body.desc.trim();
    if (body.founded_year !== undefined) data.founded_year = body.founded_year;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const club = await prisma.clubs.update({ where: { id }, data });

    return res.status(200).json({
      success: true,
      data: club
    });
  } catch (error) {
    next(error);
  }
}

async function deleteClub(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const club = await prisma.clubs.findUnique({
      where: { id },
      include: { _count: { select: { players: true, coaches: true } } }
    });

    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }

    if (club._count.players > 0 || club._count.coaches > 0) {
      return res.status(400).json({
        success: false,
        message: `Club cannot be deleted: still linked to ${club._count.players} player(s) and ${club._count.coaches} coach(es)`
      });
    }

    await prisma.clubs.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Club deleted",
      data: club
    });
  } catch (error) {
    next(error);
  }
}

function validateClub(body, isCreate) {
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field);

  if (isCreate) {
    for (const field of ["name", "country", "desc", "founded_year"]) {
      if (!has(field)) {
        return `${field} is required`;
      }
    }
  }

  if (has("name")) {
    if (typeof body.name !== "string" || body.name.trim().length < 1 || body.name.trim().length > 100) {
      return "name must be a string between 1 and 100 characters";
    }
  }

  if (has("country")) {
    if (
      typeof body.country !== "string" ||
      body.country.trim().length < 1 ||
      body.country.trim().length > 100
    ) {
      return "country must be a string between 1 and 100 characters";
    }
  }

  if (has("desc")) {
    if (typeof body.desc !== "string" || body.desc.trim().length < 1 || body.desc.trim().length > 500) {
      return "desc must be a string between 1 and 500 characters";
    }
  }

  if (has("founded_year")) {
    const currentYear = new Date().getFullYear();
    if (
      !Number.isInteger(body.founded_year) ||
      body.founded_year < 1800 ||
      body.founded_year > currentYear
    ) {
      return `founded_year must be an integer between 1800 and ${currentYear}`;
    }
  }

  return null;
}

module.exports = {
  getClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub
};
