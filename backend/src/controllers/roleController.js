const prisma = require("../config/database");

async function getRoles(req, res, next) {
  try {
    const { search } = req.query;
    const where = {};
    if (search) {
      where.name = { contains: search };
    }

    const roles = await prisma.roles.findMany({
      where,
      orderBy: { id: "asc" },
      include: { _count: { select: { coaches: true } } }
    });

    return res.status(200).json({
      success: true,
      data: roles,
      count: roles.length
    });
  } catch (error) {
    next(error);
  }
}

async function getRoleById(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const role = await prisma.roles.findUnique({ where: { id } });
    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    return res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    next(error);
  }
}

async function createRole(req, res, next) {
  try {
    const body = req.body || {};

    const invalid = validateRole(body, true);
    if (invalid) {
      return res.status(400).json({ success: false, message: invalid });
    }

    const duplicate = await prisma.roles.findFirst({ where: { name: body.name.trim() } });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Role "${body.name.trim()}" already exists`
      });
    }

    const role = await prisma.roles.create({ data: { name: body.name.trim() } });

    return res.status(201).json({
      success: true,
      data: role
    });
  } catch (error) {
    next(error);
  }
}

async function updateRole(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const existing = await prisma.roles.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    const body = req.body || {};

    const invalid = validateRole(body, false);
    if (invalid) {
      return res.status(400).json({ success: false, message: invalid });
    }

    if (body.name === undefined) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    const duplicate = await prisma.roles.findFirst({
      where: { name: body.name.trim(), NOT: { id } }
    });
    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Role "${body.name.trim()}" already exists`
      });
    }

    const role = await prisma.roles.update({ where: { id }, data: { name: body.name.trim() } });

    return res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    next(error);
  }
}

async function deleteRole(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    const role = await prisma.roles.findUnique({
      where: { id },
      include: { _count: { select: { coaches: true } } }
    });

    if (!role) {
      return res.status(404).json({ success: false, message: "Role not found" });
    }

    if (role._count.coaches > 0) {
      return res.status(400).json({
        success: false,
        message: `Role cannot be deleted: still used by ${role._count.coaches} coach(es)`
      });
    }

    await prisma.roles.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Role deleted",
      data: role
    });
  } catch (error) {
    next(error);
  }
}

function validateRole(body, isCreate) {
  const has = (field) => Object.prototype.hasOwnProperty.call(body, field);

  if (isCreate && !has("name")) {
    return "name is required";
  }

  if (has("name")) {
    if (typeof body.name !== "string" || body.name.trim().length < 1 || body.name.trim().length > 100) {
      return "name must be a string between 1 and 100 characters";
    }
  }

  return null;
}

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};
