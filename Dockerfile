# Multi-stage Dockerfile for Vite React frontend

# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for the build)
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Set the build-time argument for the API key
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the build output from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 and start Nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
