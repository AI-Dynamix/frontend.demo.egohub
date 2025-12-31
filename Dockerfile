# --- Stage 1: Build frontend với cache tốt hơn ---
FROM node:20-alpine AS build

WORKDIR /app

# Copy riêng các file định nghĩa dependency để tận dụng cache Docker
COPY package.json yarn.lock ./

# Cài đặt dependencies với yarn
RUN yarn install --frozen-lockfile

# Copy phần còn lại của source code
COPY . .

# Build ứng dụng
RUN yarn build

# --- Stage 2: Image production với Nginx ---
FROM nginx:alpine

# Copy cấu hình nginx tùy chỉnh
COPY nginx.conf /etc/nginx/nginx.conf

# Copy build output từ stage trước
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 7000

CMD ["nginx", "-g", "daemon off;"]

