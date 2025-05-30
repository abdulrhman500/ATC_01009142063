#!/bin/sh
# Exit immediately if a command exits with a non-zero status.
set -e

echo "Applying database migrations..."
# This command applies pending migrations.
# Requires 'prisma' CLI to be available (should be in production dependencies).
npx prisma migrate deploy

echo "Running database seed..."
# This command runs your seed script defined in package.json under prisma.seed
# Requires 'prisma' CLI and your seed script setup.
npx prisma db seed

echo "Starting application..."
# Execute the command passed as CMD in Dockerfile (e.g., node dist/src/bootstrap.js)
exec "$@"