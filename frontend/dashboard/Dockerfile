FROM node:20-alpine

WORKDIR /app

COPY dashboard/package.json dashboard/package-lock.json* ./
RUN npm install

COPY dashboard/ .
COPY design-system /design-system

ENV API_PROXY=http://backend:5000
EXPOSE 5174

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"]
