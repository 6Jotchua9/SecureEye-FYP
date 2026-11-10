FROM node:20-alpine

WORKDIR /app

COPY portal/package.json portal/package-lock.json* ./
RUN npm install

COPY portal/ .
COPY design-system /design-system

ENV API_PROXY=http://backend:5000
EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
