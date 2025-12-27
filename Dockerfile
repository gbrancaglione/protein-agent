FROM node:24-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "run", "server:dev"]
