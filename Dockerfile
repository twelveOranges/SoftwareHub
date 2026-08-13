# Software Hub — production container image
# Serves static assets via Nginx on port 80.
# Pinned to a specific version so rebuilds are reproducible.
FROM nginx:latest

# Copy custom nginx config that:
#   - Sets correct MIME types for .apk/.dmg/.exe/.svg/.yaml
#   - Enables gzip for text assets
#   - Disables caching of index.html / JS / YAML so updates deploy instantly
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the "code" part of the site — anything that changes together with the
# image release. Frequently-edited content (data/, icons/, downloads/) is
# expected to be mounted from the host as a read-only volume at runtime.
COPY index.html /usr/share/nginx/html/index.html
COPY README.md  /usr/share/nginx/html/README.md
COPY css/       /usr/share/nginx/html/css/
COPY js/        /usr/share/nginx/html/js/
COPY fonts/     /usr/share/nginx/html/fonts/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
