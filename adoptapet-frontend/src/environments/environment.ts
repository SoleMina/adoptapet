export const environment = {
  production: true,
  /** API Gateway. Every request of the app goes through it. */
  apiUrl: 'http://localhost:8080/api',
  /** Gateway origin, used to build absolute URLs for pet images (`imageUrl` comes as `/api/pets/images/...`). */
  apiOrigin: 'http://localhost:8080',
};
