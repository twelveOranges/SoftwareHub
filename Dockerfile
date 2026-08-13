# Software Hub — production container image
# Serves static assets via Nginx on port 80.
FROM nginx:alpine

# Copy custom nginx config that:
#   - Sets correct MIME types for .apk/.dmg/.exe/.svg
#   - Enables gzip for text assets
#   - Disables caching of index.html / JS so updates deploy instantly
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy all static assets. `downloads/` is expected to be mounted as a volume
# at runtime (so you can update installer files without rebuilding the image).
COPY index.html /usr/share/nginx/html/index.html
COPY README.md  /usr/share/nginx/html/README.md
COPY css/       /usr/share/nginx/html/css/
COPY js/        /usr/share/nginx/html/js/
COPY data/      /usr/share/nginx/html/data/
COPY icons/     /usr/share/nginx/html/icons/
COPY fonts/     /usr/share/nginx/html/fonts/

# Placeholder for downloads (will be overridden by volume mount)
RUN mkdir -p /usr/share/nginx/html/downloads/mac \
             /usr/share/nginx/html/downloads/win \
             /usr/share/nginx/html/downloads/android

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
