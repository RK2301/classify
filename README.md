# Classify

**Classify** — A microservices platform for private schools, built with TypeScript and Express.js.

> Short: A set of backend services to manage students, courses, attendance, shifts, materials and more. Built for containerized deployment (Docker & Kubernetes), with CI/CD and message-based communication.

---

## Table of contents

* [About](#about)
* [Features](#features)
* [Architecture](#architecture)
* [Services](#services)
* [Tech stack](#tech-stack)
* [Prerequisites](#prerequisites)
* [Quickstart — single service](#quickstart-—-single-service)
* [Quickstart — full development (Kubernetes / Skaffold)](#quickstart-—-full-development-kubernetes--skaffold)
* [Environment variables](#environment-variables)
* [Database & migrations](#database--migrations)
* [Docker & building images](#docker--building-images)
* [CI / CD and deployment](#ci--cd-and-deployment)
* [Troubleshooting](#troubleshooting)
* [Contributing](#contributing)
* [License](#license)
* [Contact](#contact)

---

## About

Classify is a microservice-based backend platform intended for private schools and tutoring centers. It provides separate services for users, courses, attendance tracking, materials management, shifts scheduling, and more so each domain can be developed and deployed independently.

This repository contains the services, Kubernetes manifests (skaffold.yaml and `infra/`), and GitHub Actions workflows used to build and deploy the system.

## Features

* Multi-service architecture (Express + TypeScript)
* SQL-based persistence (MySQL)
* Message broker integration (RabbitMQ) for async communication
* Email notifications via SendGrid
* Containerized (Docker) and Kubernetes-ready (Skaffold manifests included)
* CI/CD pipelines in `.github/workflows`

## Architecture

Each domain is implemented as an independent service (folder per service). Services communicate synchronously via HTTP and asynchronously via RabbitMQ events where needed. The repository includes `infra/` manifests and a `skaffold.yaml` to run everything in a local k8s cluster during development.

## Services

The repo contains (list may evolve):

* `users` — authentication, user management
* `attendance` — attendance recording & reporting
* `courses` — courses CRUD and enrollment logic
* `materials` — course materials storage/links
* `shifts` — scheduling and shift allocation for teachers
* `subjects` — subjects catalog
* `reset-password` — OTP and password reset flow (9-digit ID + 4-digit OTP flow used in the app)
* `infra` — k8s manifests, Helm charts or helper manifests

Each service is a TypeScript Express app. Check each service folder for more specific README and scripts.

## Tech stack

* Node.js + TypeScript
* Express.js
* MySQL (Sequelize or a similar ORM)
* RabbitMQ for messaging
* Docker, Kubernetes, Skaffold
* GitHub Actions for CI/CD
* SendGrid for emails (via Nodemailer adapters or official SDK)
* Next.js + Tailwind frontend

## Prerequisites

* Docker & Docker Compose (for local container runs)
* Kubernetes cluster (Docker Desktop or kind/minikube) if using Skaffold
* Skaffold installed (if using the `skaffold.yaml` workflow)
* Node.js 18+ and npm/yarn (for running single services)

## Quickstart — single service (local dev)

Run one service locally for quick development:

```bash
# 1. clone repo
git clone git@github.com:RK2301/classify.git
cd classify

# 2. choose a service, e.g. users
cd users
cp .env.example .env   # fill values as needed
npm install
npm run dev             # or: npm run start:dev / pnpm / yarn equivalent
```

This starts the chosen service in watch mode. Repeat for other services when needed.

## Quickstart — full development (Kubernetes / Skaffold)

This repo includes a `skaffold.yaml` and an `infra/` directory to run the full stack locally in Kubernetes.

```bash
# requirements: Docker, kubectl, Skaffold, a local k8s cluster
git clone git@github.com:RK2301/classify.git
cd classify
skaffold dev
```

`skaffold dev` will build images, apply manifests, and stream logs for the services. See `infra/` for service manifests and `skaffold.yaml` for build/deploy configuration.

> Note: If your machine uses Docker Desktop, ensure Kubernetes is enabled and resources (CPU/memory) are sufficient.

## Environment variables

Each service contains its own `.env.example`. Typical variables used across services:

```
NODE_ENV=development
PORT=3000
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_ROOT_PASSWORD=changeme
MYSQL_DATABASE=classify_<service>
RabbitMQ_URL=amqp://admin:password@rabbitmq-srv:5672
JWT_SECRET=your_jwt_secret
```

Copy `.env.example` to `.env` for each service and update values. For k8s deployments these values live in Secrets/ConfigMaps.

## Database & migrations

If a migration system is used (Sequelize or TypeORM), run migrations from the service root. Example (Sequelize CLI):

```bash
# from service folder
npx sequelize db:migrate
npx sequelize db:seed:all
```

If your services auto-run migrations on startup, check the service configuration and logs.

## Docker & building images

To build a single service image locally:

```bash
# from repo root
docker build -t classify-users ./users
# or use skaffold build to build all configured images
skaffold build
```

## CI / CD and deployment

This repo contains GitHub Actions workflows under `.github/workflows/` that build images and deploy to your target (DigitalOcean, k8s cluster, etc.). Update secrets in your GitHub repo (DOCKER_USERNAME, DOCKER_PASSWORD, FIREBASE_CONFIG, DIGITALOCEAN_ACCESS_TOKEN, etc.) to enable automatic deployments.

## Troubleshooting

* If `skaffold dev` fails with image build errors, ensure Docker daemon is running and you have enough resources.
* For RabbitMQ connection issues, verify `RABBITMQ_URL` and that the broker is reachable.
* Check each service logs (`kubectl logs` or container logs) for stack traces.

## Contributing

Contributions are welcome. Please open issues and PRs for feature requests or bug fixes. Follow the code style used in the repo and include tests where relevant.


## Contact

If you want to discuss the project or need help, open an issue or contact the maintainer: `rami.khattab0@gmail.com`.

---

*Notes*: This README is a starting point — adapt the environment variable names, commands and migration steps to match the exact scripts used in each service.
