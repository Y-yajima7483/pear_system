FROM node:24-alpine

# Enable Corepack for Yarn v4
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Set the working directory
WORKDIR /app

# Copy every dependency-resolution input before installing. The tracked Yarn
# configuration selects node-modules linking and must participate in the cache.
COPY next/package.json next/yarn.lock next/.yarnrc.yml ./

# Install dependencies using Yarn v4
RUN yarn install --immutable

# Copy the full Next.js project
COPY next/ ./

# Expose the correct port for internal use
EXPOSE 3000

# Ensure polling is enabled inside Docker
ENV CHOKIDAR_USEPOLLING=true

# Run Next.js in development mode
CMD ["yarn", "dev"]
