#!/bin/sh
# Exit immediately if a command exits with a non-zero status.
set -e

echo "Applying database migrations..."
# This command applies pending migrations.
# Requires 'prisma' CLI to be available (should be in production dependencies).
npx prisma migrate deploy

npx prisma db seed

echo "Starting application..."
# Execute the command passed as CMD in Dockerfile (or arguments to this script)
exec "$@"