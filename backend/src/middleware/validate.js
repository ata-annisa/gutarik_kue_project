// Validates req.body against a zod schema and replaces it with the parsed, typed result.
// Schemas are strict, so unknown keys (for example a client-supplied "role") are rejected.
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    return res.status(400).json({
      error: "Invalid input",
      details: result.error.issues.map((i) => ({
        field: i.path.join(".") || "(body)",
        message: i.message,
      })),
    });
  }
  req.body = result.data;
  next();
};
