FROM node:22 AS build-stage
WORKDIR /app
COPY package.json ./
RUN yarn install
COPY . .
# Public base path the built assets are served from (e.g. /static/ when the
# FastAPI backend serves the SPA under /static). Defaults to / for root serving.
ARG VITE_BASE=/
RUN yarn vite build --base="$VITE_BASE"

FROM nginx:1.27-alpine AS production-stage
ENV TZ=Asia/Tashkent
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Rendered at container start by nginx entrypoint (envsubst on ${BACKEND_HOST}/${BACKEND_PORT})
COPY default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build-stage /app/dist /app
