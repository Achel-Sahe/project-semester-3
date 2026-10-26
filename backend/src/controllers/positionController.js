const prisma = require("../config/database");

async function getPositions(req, res, next) {
  try {
    const { search } = req.query;
    const where = {};
    if (search) {
      where.name = { contains: search };
    }

    const positions = await prisma.positions.findMany({
      where,
      orderBy: { id: "asc" },
      include: { _count: { select: { players: true } } }
    });

    return res.status(200).json({
      success: true,
      data: positions,
      count: positions.length
    });
  } catch (error) {
    next(error);
  }
}

async function getPositionById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const position = await prisma.positions.findUnique({ where: { id } });
    if (!position) {
      return res.status(404).json({ success: false, message: "Position not found" });
    }

    return res.status(200).json({
      success: true,
      data: position
    });
  } catch (error) {
    next(error);
  }
}

async function createPosition(req, res, next) {
  try {
    const body = req.body || {};

    const invalid = validatePosition(body, true);
    if (invalid) {
      return res.status(400).json({ success: false, message: invalid });
    }

    const duplicate = await prisma.positions.findFirst({
      where: { name: body.name.trim() }
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Position "${body.name.trim()}" already exists`
      });
    }

    const position = await prisma.positions.create({
      data: { name: body.name.trim() }
    });

    return res.status(201).json({
      success: true,
      data: position
    });
  } catch (error) {
    next(error);
  }
}

async function updatePosition(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const existing = await prisma.positions.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Position not found" });
    }

    const body = req.body || {};

    const invalid = validatePosition(body, false);
    if (invalid) {
      return res.status(400).json({ success: false, message: invalid });
    }

    if (body.name === undefined) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const duplicate = await prisma.positions.findFirst({
      where: { name: body.name.trim(), NOT: { id } }
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Position "${body.name.trim()}" already exists`
      });
    }

    const position = await prisma.positions.update({
      where: { id },
      data: { name: body.name.trim() }
    });

    return res.status(200).json({
      success: true,
      data: position
    });
  } catch (error) {
    next(error);
  }
}

async function deletePosition(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const position = await prisma.positions.findUnique({
      where: { id },
      include: { _count: { select: { players: true } } }
    });

    if (!position) {
      return res.status(404).json({ success: false, message: "Position not found" });
    }

    if (position._count.players > 0) {
      return res.status(400).json({
        success: false,
        message: `Position cannot be deleted: still used by ${position._count.players} player(s)`
      });
    }

    await prisma.positions.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Position deleted",
      data: position
    });
  } catch (error) {
    next(error);
  }
}

function validatePosition(body, isCreate) {
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field);

  if (isCreate && !has("name")) {
    return "name is required";
  }

  if (has("name")) {
    if (typeof body.name !== "string" || body.name.trim().length < 1 || body.name.trim().length > 50) {
      return "name must be a string between 1 and 50 characters";
    }
  }

  return null;
}

module.exports = {
  getPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition
};
