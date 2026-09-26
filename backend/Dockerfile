# Image Playwright officielle : Chrome + Xvfb + dépendances système déjà présents.
# Sa version DOIT correspondre à playwright-core dans package.json.
FROM mcr.microsoft.com/playwright:v1.63.0-noble

ENV NODE_ENV=production \
    MODELS_DIR=/app/models \
    DISPLAY=:99

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma/
RUN pnpm install --frozen-lockfile --prod=false

COPY . .
RUN pnpm exec prisma generate && pnpm build \
    && pnpm prune --prod --ignore-scripts

# Modèle d'embeddings intégré à l'image : pas de téléchargement au premier lancement
RUN node -e "require('./dist/matching/embeddings.js').embed(['test'], 'query').then(() => process.exit(0))"

RUN mkdir -p /app/data && chown -R pwuser:pwuser /app
USER pwuser
EXPOSE 4000

# Écran virtuel pour Chrome (Indeed), migrations de la base, puis lancement de l'API.
# Pas de xvfb-run : il se fige en PID 1 (attend un SIGUSR1 qui n'arrive jamais).
CMD ["sh", "-c", "Xvfb :99 -screen 0 1280x1024x24 -nolisten tcp 2>/dev/null & ./node_modules/.bin/prisma migrate deploy && exec node dist/index.js"]
