const prisma = require("../config/database");

const COACH_INCLUDE = {
  club: true,
  role: true
};

async function getCoaches(req, res, next) {
  try {
    const { search, role, club } = req.query;
    const where = {};

    if (search) {
      where.name = { contains: search };
    }

    if (role) {
      where.role = { name: role };
    }

    if (club) {
      const clubId = Number(club);
      if (!Number.isInteger(clubId) || clubId < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid club: club query parameter must be a positive integer"
        });
      }
      where.club_id = clubId;
    }

    const coaches = await prisma.coaches.findMany({
      where,
      include: COACH_INCLUDE,
      orderBy: { id: "asc" }
    });

    return res.status(200).json({
      success: true,
      data: coaches,
      count: coaches.length
    });
  } catch (error) {
    next(error);
  }
}

async function getCoachById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const coach = await prisma.coaches.findUnique({
      where: { id },
      include: COACH_INCLUDE
    });

    if (!coach) {
      return res.status(404).json({
        success: false,
        message: "Coach not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: coach
    });
  } catch (error) {
    next(error);
  }
}

async function createCoach(req, res, next) {
  try {
    const body = req.body || {};

    const invalid = validateCoach(body, true);
    if (invalid) {
      return res.status(400).json({ success: false, message: invalid });
    }

    const data = {
      name: body.name.trim(),
      age: body.age,
      nationality: body.nationality.trim(),
      club_id: body.club_id,
      role_id: body.role_id,
      photo_url: body.photo_url ? body.photo_url.trim() : null
    };

    const foreignKeyError = await checkCoachForeignKeys(data);
    if (foreignKeyError) {
      return res.status(400).json({ success: false, message: foreignKeyError });
    }

    const coach = await prisma.coaches.create({
      data,
      include: COACH_INCLUDE
    });

    return res.status(201).json({
      success: true,
      data: coach
    });
  } catch (error) {
    next(error);
  }
}

async function updateCoach(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const existing = await prisma.coaches.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Coach not found" });
    }

    const body = req.body || {};

    const invalid = validateCoach(body, false);
    if (invalid) {
      return res.status(400).json({ success: false, message: invalid });
    }

    const data = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.age !== undefined) data.age = body.age;
    if (body.nationality !== undefined) data.nationality = body.nationality.trim();
    if (body.club_id !== undefined) data.club_id = body.club_id;
    if (body.role_id !== undefined) data.role_id = body.role_id;
    if (body.photo_url !== undefined) {
      data.photo_url = body.photo_url ? body.photo_url.trim() : null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const foreignKeyError = await checkCoachForeignKeys(data);
    if (foreignKeyError) {
      return res.status(400).json({ success: false, message: foreignKeyError });
    }

    const coach = await prisma.coaches.update({
      where: { id },
      data,
      include: COACH_INCLUDE
    });

    return res.status(200).json({
      success: true,
      data: coach
    });
  } catch (error) {
    next(error);
  }
}

async function deleteCoach(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const coach = await prisma.coaches.findUnique({ where: { id } });
    if (!coach) {
      return res.status(404).json({ success: false, message: "Coach not found" });
    }

    await prisma.coaches.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Coach deleted",
      data: coach
    });
  } catch (error) {
    next(error);
  }
}

function validateCoach(body, isCreate) {
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field);

  if (isCreate) {
    for (const field of ["name", "age", "nationality", "club_id", "role_id"]) {
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

  if (has("nationality")) {
    if (
      typeof body.nationality !== "string" ||
      body.nationality.trim().length < 1 ||
      body.nationality.trim().length > 100
    ) {
      return "nationality must be a string between 1 and 100 characters";
    }
  }

  if (has("age")) {
    if (!Number.isInteger(body.age) || body.age < 25 || body.age > 80) {
      return "age must be an integer between 25 and 80";
    }
  }

  if (has("club_id")) {
    if (!Number.isInteger(body.club_id) || body.club_id < 1) {
      return "club_id must be a positive integer";
    }
  }

  if (has("role_id")) {
    if (!Number.isInteger(body.role_id) || body.role_id < 1) {
      return "role_id must be a positive integer";
    }
  }

  if (has("photo_url") && body.photo_url !== null && body.photo_url !== undefined) {
    if (typeof body.photo_url !== "string" || body.photo_url.length > 255) {
      return "photo_url must be a string of maximum 255 characters";
    }
  }

  return null;
}

async function checkCoachForeignKeys(data) {
  if (data.club_id !== undefined) {
    const club = await prisma.clubs.findUnique({ where: { id: data.club_id } });
    if (!club) {
      return `Invalid club_id: club with id ${data.club_id} does not exist`;
    }
  }

  if (data.role_id !== undefined) {
    const role = await prisma.roles.findUnique({ where: { id: data.role_id } });
    if (!role) {
      return `Invalid role_id: role with id ${data.role_id} does not exist`;
    }
  }

  return null;
}

module.exports = {
  getCoaches,
  getCoachById,
  createCoach,
  updateCoach,
  deleteCoach
};
