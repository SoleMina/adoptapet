# AdoptaPet

Pet adoption platform.

| Folder | Content |
|---|---|
| [`adoptapet-backend/`](adoptapet-backend/README.md) | Spring Boot microservices: Eureka, API Gateway, users, pets, adoptions, notifications (MySQL + RabbitMQ) |
| [`adoptapet-frontend/`](adoptapet-frontend/README.md) | Web client (coming soon) |

The frontend talks only to the API Gateway: `http://localhost:8080/api/...`.

See [adoptapet-backend/README.md](adoptapet-backend/README.md) for requirements, startup order and the API.
