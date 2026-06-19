FROM node:22 as build-stage
WORKDIR /app
COPY ./ .
# CMD ["/bin/sh", "-c", "source", "environment/.env.example"]
RUN yarn install
RUN yarn vite build

FROM nginx:1.25.1-alpine3.17 as production-stage
ENV TZ=Asia/Tashkent 
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN mkdir /app

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build-stage /app/dist /app
