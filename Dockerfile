# Use an official Node.js runtime as the base image
FROM node:18 AS build

# Set the working directory inside the container
WORKDIR /app

# Install global dependencies like TypeScript and ts-node
RUN npm install -g typescript ts-node

# Copy package.json and package-lock.json (or npm-shrinkwrap.json) to leverage Docker caching
COPY package*.json ./

# Install the project's dependencies
RUN npm install

# Copy the entire project to the working directory in the container
COPY . .

# Build the project using TypeScript
RUN npm run build

# Create a second stage to create a smaller image for the runtime environment
FROM node:18 AS production

# Set the working directory for the runtime container
WORKDIR /app

# Copy only the necessary files from the build container
COPY --from=build /app/package*.json ./
COPY --from=build /app/build ./build

# Install production dependencies (without dev dependencies)
RUN npm install --production

# Expose the port that the app will run on (e.g., 3000)
EXPOSE 3004

# Start the application using node
CMD ["node", "build/index.js"]
