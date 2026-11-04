/** Parses and stores validated input on req.validated[source]. */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join('.') || source,
        message: issue.message,
      }));
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    req.validated = req.validated || {};
    req.validated[source] = result.data;
    if (source === 'body') req.body = result.data;
    next();
  };
}
