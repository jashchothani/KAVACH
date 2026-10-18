FROM nginx:alpine

# Install openssl for automated SSL certificate bootstrap
RUN apk add --no-cache openssl

# Clean default assets and configuration
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration with HTTP and HTTPS support
COPY nginx.conf /etc/nginx/conf.d/kavach.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy frontend source files
COPY . /usr/share/nginx/html

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
