type FormValue = string | number | boolean | null | undefined;

/**
 * Builds multipart/form-data for the endpoints that receive fields + files (pets, applications, signed act).
 * Empty values are skipped and the browser sets the Content-Type with its boundary.
 */
export function toFormData(
  fields: object,
  files: Record<string, File | null | undefined> = {},
): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields) as [string, FormValue][]) {
    if (value !== null && value !== undefined && value !== '') {
      data.append(key, String(value));
    }
  }
  for (const [key, file] of Object.entries(files)) {
    if (file) {
      data.append(key, file, file.name);
    }
  }
  return data;
}
