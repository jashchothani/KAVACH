FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the frontend
RUN npm run build

# Install a simple static file server
RUN npm install -g serve

CMD ["serve", "-s", "dist", "-l", "5173"]
