FROM node:20-alpine

# Enable Corepack for Yarn v4
RUN corepack enable && corepack prepare yarn@4.7.0 --activate

# Set the working directory
WORKDIR /app

# Copy package manager files first for better caching
COPY next/package.json next/yarn.lock ./

# Install dependencies using Yarn v4
RUN yarn install

# Copy the full Next.js project
COPY next/ ./

# Expose the correct port for internal use
EXPOSE 3000

# Ensure polling is enabled inside Docker
ENV CHOKIDAR_USEPOLLING=true

# Run Next.js in development mode
CMD ["yarn", "dev"]