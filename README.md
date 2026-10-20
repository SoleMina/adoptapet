# AdoptaPet

Pet adoption platform.

| Folder | Content |
|---|---|
| [`adoptapet-backend/`](adoptapet-backend/README.md) | Spring Boot microservices: Eureka, API Gateway, users, pets, adoptions, notifications (MySQL + RabbitMQ) |
| [`adoptapet-frontend/`](adoptapet-frontend/README.md) | Web client (coming soon) |

The frontend talks only to the API Gateway: `http://localhost:8080/api/...`.

See [adoptapet-backend/README.md](adoptapet-backend/README.md) for requirements, startup order and the API.

## Run with Docker (recommended for the team)

Only Docker Desktop is needed: Java, Maven, Node, MySQL and RabbitMQ run in containers with the same versions for
everyone.

```sh
cp adoptapet-backend/.env.example adoptapet-backend/.env   # first time only: fill JWT_SECRET and ADMIN_PASSWORD
docker compose up -d --build
```

| URL | What |
|---|---|
| http://localhost:4200 | Angular app (production build served by nginx) |
| http://localhost:8080/api | API Gateway |
| http://localhost:8761 | Eureka dashboard |
| http://localhost:15672 | RabbitMQ UI (`adoptapet` / `adoptapet`) |
| `localhost:3307` | MySQL (`root` / `adoptapet`); 3307 so it does not clash with a local MySQL |

Give Eureka ~30 seconds before calling through the gateway. Useful commands:

```sh
docker compose logs -f adoption-service           # logs of one service
docker compose up -d --build pet-service          # rebuild one service after changing its code
docker compose down                               # stop (data is kept in the mysql-data volume)
docker compose down -v                            # stop and delete the database (next up starts from the seed)
```

**Example data.** On the first start (empty `mysql-data` volume) MySQL imports
[`adoptapet-backend/database/test-users.sql`](adoptapet-backend/database/test-users.sql): test users and three pets
(Luna, Milo, Coco). The `uploads-seed` container copies their photos from `adoptapet-backend/database/pet-images/` into
`adoptapet-backend/uploads/pets/`. Log in with `admin.test`, `worker.test` or `ana.torres512770` (adopter), all with
password `secreto123`. The file already has an ADMIN, so the `ADMIN_*` of `.env` is not created.

* In Docker, MySQL and RabbitMQ credentials are fixed in `docker-compose.yml`; `DB_*` and `RABBITMQ_*` from `.env`
  are ignored. The rest of `.env` (`JWT_SECRET`, `ADMIN_*`, `CORS_ALLOWED_ORIGINS`) is used as is.
* Uploaded pet photos and documents are stored in `adoptapet-backend/uploads/`, the same folder as without Docker.
* Port 5672 is published too. Stop a local RabbitMQ (`brew services stop rabbitmq`) before `docker compose up`.
* For frontend work with hot reload, free port 4200 with `docker compose stop frontend` and use `npm start` as
  usual; the backend keeps running in Docker.
