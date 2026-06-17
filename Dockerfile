# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Build arguments for environment variables
ARG VITE_UTM5_BASE_URL
ARG VITE_US_BASE_URL
ARG VITE_DADATA_TOKEN
ARG VITE_SUPABASE_SUPABASE_ANON_KEY

# Set environment variables for build
ENV VITE_UTM5_BASE_URL=$VITE_UTM5_BASE_URL
ENV VITE_US_BASE_URL=$VITE_US_BASE_URL
ENV VITE_DADATA_TOKEN=$VITE_DADATA_TOKEN
ENV VITE_SUPABASE_SUPABASE_ANON_KEY=$VITE_SUPABASE_SUPABASE_ANON_KEY

COPY . .
RUN npm run generate

# Production stage
FROM nginx:alpine

COPY --from=builder /app/.output/public /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
