FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Create directories for data and uploads
RUN mkdir -p /var/www/data_private /app/uploads && \
    chown -R node:node /var/www/data_private /app/uploads

# Switch to non-root user
USER node

# Expose port 80
EXPOSE 80

# Start the server
CMD ["node", "server.js"]
