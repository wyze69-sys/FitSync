/**
 * Lightweight, dependency-free request validation middleware.
 *
 * Usage:
 *   router.post("/", validate(workoutCreateSchema), controller.create);
 *
 * A schema is a plain object mapping each field to a rule object:
 *   {
 *     type: "string" | "number" | "integer" | "email" | "date" | "boolean" | "array",
 *     required: boolean,
 *     min, max,            // numeric bounds (for number/integer)
 *     minLength, maxLength, // length bounds (for string/array)
 *     enum: [...],          // allowed values
 *     trim: boolean,        // trim surrounding whitespace (string, default true)
 *     default: any          // value applied when the field is missing
 *   }
 *
 * On success the sanitized values are written back to req[source].
 * On failure a single 400 response is returned with a readable message.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isMissing(value) {
  return value === undefined || value === null || value === "";
}

function validateField(name, rawValue, rule) {
  let value = rawValue;

  // Apply default for missing optional fields.
  if (isMissing(value)) {
    if (rule.default !== undefined) {
      return { value: rule.default };
    }
    if (rule.required) {
      return { error: `${name} is required.` };
    }
    return { value: undefined, skip: true };
  }

  switch (rule.type) {
    case "email": {
      const email = String(value).trim().toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        return { error: "Please provide a valid email address." };
      }
      return { value: email };
    }

    case "string": {
      let str = String(value);
      if (rule.trim !== false) str = str.trim();
      if (rule.required && str.length === 0) {
        return { error: `${name} is required.` };
      }
      if (rule.minLength !== undefined && str.length < rule.minLength) {
        return { error: `${name} must be at least ${rule.minLength} characters.` };
      }
      if (rule.maxLength !== undefined && str.length > rule.maxLength) {
        return { error: `${name} must not exceed ${rule.maxLength} characters.` };
      }
      if (rule.enum && !rule.enum.includes(str)) {
        return { error: `${name} must be one of: ${rule.enum.join(", ")}.` };
      }
      return { value: str };
    }

    case "number":
    case "integer": {
      const num = Number(value);
      if (Number.isNaN(num)) {
        return { error: `${name} must be a number.` };
      }
      if (rule.type === "integer" && !Number.isInteger(num)) {
        return { error: `${name} must be a whole number.` };
      }
      if (rule.min !== undefined && num < rule.min) {
        return { error: `${name} must be at least ${rule.min}.` };
      }
      if (rule.max !== undefined && num > rule.max) {
        return { error: `${name} must not exceed ${rule.max}.` };
      }
      return { value: num };
    }

    case "boolean": {
      if (typeof value === "boolean") return { value };
      if (value === "true") return { value: true };
      if (value === "false") return { value: false };
      return { error: `${name} must be true or false.` };
    }

    case "date": {
      const str = String(value).trim();
      if (!DATE_REGEX.test(str) || Number.isNaN(new Date(str).getTime())) {
        return { error: `${name} must be a valid date (YYYY-MM-DD).` };
      }
      return { value: str };
    }

    case "array": {
      if (!Array.isArray(value)) {
        return { error: `${name} must be a list.` };
      }
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        return { error: `${name} must contain at least ${rule.minLength} item(s).` };
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        return { error: `${name} must not contain more than ${rule.maxLength} items.` };
      }
      return { value };
    }

    default:
      return { value };
  }
}

function validate(schema, source = "body") {
  return (req, res, next) => {
    const input = req[source] || {};
    const sanitized = {};
    const errors = [];

    for (const [name, rule] of Object.entries(schema)) {
      const result = validateField(name, input[name], rule);
      if (result.error) {
        errors.push(result.error);
        continue;
      }
      if (!result.skip) {
        sanitized[name] = result.value;
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ error: errors[0], details: errors });
      return;
    }

    // Preserve any keys not covered by the schema (e.g. nested exercise data
    // that is validated inside the service layer).
    req[source] = { ...input, ...sanitized };
    next();
  };
}

module.exports = { validate };
