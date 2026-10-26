const prisma = require("../config/database");

const PLAYER_INCLUDE = {
  club: true,
  position: true
};

async function getPlayers(req, res, next) {
  try {
    const { search, position, club } = req.query;
    const where = {};

    if (search) {
      where.name = { contains: search };
    }

    if (position) {
      where.position = { name: position };
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

    const players = await prisma.players.findMany({
      where,
      include: PLAYER_INCLUDE,
      orderBy: { id: "asc" }
    });

    return res.status(200).json({
      success: true,
      data: players,
      count: players.length
    });
  } catch (error) {
    next(error);
  }
}

async function getPlayerById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid id"
      });
    }

    const player = await prisma.players.findUnique({
      where: { id },
      include: PLAYER_INCLUDE
    });

    if (!player) {
      return res.status(404).json({
        success: false,
        message: "Player not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: player
    });
  } catch (error) {
    next(error);
  }
}

async function createPlayer(req, res, next) {
  try {
    const body = req.body || {};

    const invalid = validatePlayer(body, true);
    if (invalid) {
      return res.status(400).json({ success: false, message: invalid });
    }

    const data = {
      name: body.name.trim(),
      age: body.age,
      nationality: body.nationality.trim(),
      squad_number: body.squad_number,
      club_id: body.club_id,
      position_id: body.position_id,
      photo_url: body.photo_url ? body.photo_url.trim() : null
    };

    const foreignKeyError = await checkPlayerForeignKeys(data);
    if (foreignKeyError) {
      return res.status(400).json({ success: false, message: foreignKeyError });
    }

    const squadTaken = await prisma.players.findFirst({
      where: { club_id: data.club_id, squad_number: data.squad_number }
    });
    if (squadTaken) {
      return res.status(400).json({
        success: false,
        message: `squad_number ${data.squad_number} is already used by ${squadTaken.name} in this club`
      });
    }

    const player = await prisma.players.create({
      data,
      include: PLAYER_INCLUDE
    });

    return res.status(201).json({
      success: true,
      data: player
    });
  } catch (error) {
    next(error);
  }
}

async function updatePlayer(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const existing = await prisma.players.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Player not found" });
    }

    const body = req.body || {};

    const invalid = validatePlayer(body, false);
    if (invalid) {
      return res.status(400).json({ success: false, message: invalid });
    }

    const data = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.age !== undefined) data.age = body.age;
    if (body.nationality !== undefined) data.nationality = body.nationality.trim();
    if (body.squad_number !== undefined) data.squad_number = body.squad_number;
    if (body.club_id !== undefined) data.club_id = body.club_id;
    if (body.position_id !== undefined) data.position_id = body.position_id;
    if (body.photo_url !== undefined) {
      data.photo_url = body.photo_url ? body.photo_url.trim() : null;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const foreignKeyError = await checkPlayerForeignKeys(data);
    if (foreignKeyError) {
      return res.status(400).json({ success: false, message: foreignKeyError });
    }

    const targetClubId = data.club_id !== undefined ? data.club_id : existing.club_id;
    const targetNumber = data.squad_number !== undefined ? data.squad_number : existing.squad_number;
    const squadTaken = await prisma.players.findFirst({
      where: { club_id: targetClubId, squad_number: targetNumber, NOT: { id } }
    });
    if (squadTaken) {
      return res.status(400).json({
        success: false,
        message: `squad_number ${targetNumber} is already used by ${squadTaken.name} in this club`
      });
    }

    const player = await prisma.players.update({
      where: { id },
      data,
      include: PLAYER_INCLUDE
    });

    return res.status(200).json({
      success: true,
      data: player
    });
  } catch (error) {
    next(error);
  }
}

async function deletePlayer(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const player = await prisma.players.findUnique({ where: { id } });
    if (!player) {
      return res.status(404).json({ success: false, message: "Player not found" });
    }

    await prisma.players.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Player deleted",
      data: player
    });
  } catch (error) {
    next(error);
  }
}

function validatePlayer(body, isCreate) {
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field);

  const required = ["name", "age", "nationality", "squad_number", "club_id", "position_id"];
  if (isCreate) {
    for (const field of required) {
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
    if (!Number.isInteger(body.age) || body.age < 16 || body.age > 45) {
      return "age must be an integer between 16 and 45";
    }
  }

  if (has("squad_number")) {
    if (!Number.isInteger(body.squad_number) || body.squad_number < 1 || body.squad_number > 99) {
      return "squad_number must be an integer between 1 and 99";
    }
  }

  if (has("club_id")) {
    if (!Number.isInteger(body.club_id) || body.club_id < 1) {
      return "club_id must be a positive integer";
    }
  }

  if (has("position_id")) {
    if (!Number.isInteger(body.position_id) || body.position_id < 1) {
      return "position_id must be a positive integer";
    }
  }

  if (has("photo_url") && body.photo_url !== null && body.photo_url !== undefined) {
    if (typeof body.photo_url !== "string" || body.photo_url.length > 255) {
      return "photo_url must be a string of maximum 255 characters";
    }
  }

  return null;
}

async function checkPlayerForeignKeys(data) {
  if (data.club_id !== undefined) {
    const club = await prisma.clubs.findUnique({ where: { id: data.club_id } });
    if (!club) {
      return `Invalid club_id: club with id ${data.club_id} does not exist`;
    }
  }

  if (data.position_id !== undefined) {
    const position = await prisma.positions.findUnique({ where: { id: data.position_id } });
    if (!position) {
      return `Invalid position_id: position with id ${data.position_id} does not exist`;
    }
  }

  return null;
}

module.exports = {
  getPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer
};
