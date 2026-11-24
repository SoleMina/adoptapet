export const environment = {
  production: true,
  /**
   * API Gateway, same origin as the app: the nginx of the frontend image proxies /api to the gateway, so the same
   * build works in Docker on localhost:4200 and on the server behind Caddy. Every request of the app goes through it.
   */
  apiUrl: '/api',
  /** Origin prepended to pet images (`imageUrl` comes as `/api/pets/images/...`); empty = same origin. */
  apiOrigin: '',
};
