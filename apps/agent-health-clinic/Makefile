# Thin aliases over `docker compose` for the containerized stack.
# Run from the app root (apps/agent-health-clinic/). No logic beyond wrapping
# compose — see docker-compose.yml and README "Run with Docker".

.PHONY: up up-d down clean logs seed reset build

## up: build images and run the stack in the foreground (http://localhost:3001)
up:
	docker compose up --build

## up-d: same as `up` but detached
up-d:
	docker compose up --build -d

## down: stop the stack; SQLite data persists on the named volume
down:
	docker compose down

## clean: stop the stack AND drop the data volume (next `up` re-seeds)
clean:
	docker compose down -v

## logs: follow logs from both services
logs:
	docker compose logs -f

## seed: force a wipe + reseed inside the running api container
seed:
	docker compose exec api node dist/seed/seed.js

## reset: drop the DB file (+ -wal/-shm), re-migrate and reseed in the container
reset:
	docker compose exec api sh -c 'rm -f /data/clinic.sqlite* && node dist/database/run-migrations.js && node dist/seed/seed.js'

## build: build both images without starting anything
build:
	docker compose build
