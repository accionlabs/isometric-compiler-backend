FROM node:18-alpine

# Set working directory
WORKDIR /usr/src

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm install

# Copy the application code
COPY . .

# Creates a "build" folder with the production build
RUN npm run build

# Expose the app port
EXPOSE 3004

# Start the server using the production build
CMD ["npm", "start"]
