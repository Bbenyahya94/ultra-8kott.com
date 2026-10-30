FROM node:22-alpine
WORKDIR /app
COPY . .
RUN node build.mjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:3000/ || exit 1
CMD ["node", "server.mjs"]
