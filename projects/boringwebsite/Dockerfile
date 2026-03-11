FROM node:20-alpine

LABEL maintainer="DailyLift"
LABEL description="Build, test, and serve the DailyLift static website"

WORKDIR /app

# Install dependencies first (caching layer)
COPY package.json package-lock.json* ./
RUN npm install --production=false

# Copy project files
COPY . .

# Default command: run tests with coverage
CMD ["npm", "run", "test:coverage"]
