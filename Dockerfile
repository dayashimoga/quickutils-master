FROM node:20-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package.json vitest.config.js ./

# Install dependencies
RUN npm install

# Copy project source and tests
COPY projects/ ./projects/
COPY tests/ ./tests/

# Run tests with coverage
CMD ["npx", "vitest", "run", "--coverage"]
