const { Prisma } = require("@prisma/client");

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
}

function errorHandler(err, req, res, next) {

  if (err && (err.type === "entity.parse.failed" || (err instanceof SyntaxError && "body" in err))) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON body"
    });
  }

  if (err && err.isApiError === true && typeof err.statusCode === "number") {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025":
        return res.status(404).json({
          success: false,
          message: "Record not found"
        });

      case "P2002":
        return res.status(400).json({
          success: false,
          message: formatUniqueError(err)
        });

      case "P2003":
        return res.status(400).json({
          success: false,
          message: "Invalid reference: the related record does not exist"
        });

      default:
        return res.status(400).json({
          success: false,
          message: "Database request failed"
        });
    }
  }

  console.error("[ERROR]", err);
  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
}

function formatUniqueError(err) {
  const target = err.meta && err.meta.target;
  const field = Array.isArray(target) ? target.join(", ") : target;
  return field
    ? `Value already exists for: ${field}`
    : "Value already exists";
}

module.exports = { notFoundHandler, errorHandler };
