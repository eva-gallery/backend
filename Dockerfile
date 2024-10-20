# Stage 1: Build the Nest.js application
FROM node:23-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json for dependency installation
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build:prod

# Stage 2: Run the application with a minimal image
FROM node:23-alpine AS runner

# Set environment variables
ENV NODE_ENV=production

# Set the working directory inside the container
WORKDIR /app

# Copy package.json for production dependencies
COPY package.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built application from the build stage
COPY --from=builder /app/dist ./dist

# Expose the application port (usually 3000 by default in Nest.js)
EXPOSE 3000

# Set the default command to run the application
CMD ["node", "dist/main"]
