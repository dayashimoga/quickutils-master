FROM node:20-bullseye

WORKDIR /app

# Install specific compatible versions directly
RUN npm init -y > /dev/null 2>&1 && \
    npm install jest@29.7.0 jest-environment-jsdom@29.7.0 && \
    # Force downgrade the hoisted jsdom to v20 (compatible with jest-env-jsdom@29)
    npm install jsdom@20.0.3 && \
    echo "jsdom version: $(node -e 'console.log(require(\"jsdom/package.json\").version)')"

COPY jest.config.js ./
COPY tests/ ./tests/
COPY projects/ ./projects/

CMD ["npx", "jest", "--coverage", "--forceExit", "--detectOpenHandles"]
