FROM node:22 as build-stage
WORKDIR /app
COPY ./ .
# CMD ["/bin/sh", "-c", "source", "environment/.env.example"]
# Public base path for the built assets. Passed by scripts/build-frontend
# (--build-arg VITE_BASE=/static/) so the publish bundle resolves under /static.
# Defaults to '/' so CI/CD and docker-compose (which serve the SPA at root) are
# unaffected when no build-arg is given.
ARG VITE_BASE=/
RUN yarn install
RUN yarn vite build --base "$VITE_BASE"

FROM nginx:1.25.1-alpine3.17 as production-stage
ENV TZ=Asia/Tashkent 
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN mkdir /app

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build-stage /app/dist /app
