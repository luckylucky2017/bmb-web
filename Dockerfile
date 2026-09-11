# Build stage: install full deps (incl. devDependencies) and compile Tailwind CSS.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:css

# Runtime stage: only production deps + the files server.js actually needs —
# keeps .env, tailwind config, and node_modules devDependencies out of the image.
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Alpine ships without tzdata, so without this `new Date()` and every
# formatDate()/toLocaleDateString() call in the app run in UTC instead of
# Vietnam time — order timestamps, "created_at" displays, etc. would all be
# off by 7 hours from what MySQL (also set to this TZ) reports.
ENV TZ=Asia/Ho_Chi_Minh
RUN apk add --no-cache tzdata
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/db ./db
COPY --from=build /app/middleware ./middleware
COPY --from=build /app/models ./models
COPY --from=build /app/routes ./routes
COPY --from=build /app/views ./views
COPY --from=build /app/public ./public

EXPOSE 3010
CMD ["node", "server.js"]
