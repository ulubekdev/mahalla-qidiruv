# 1. Rasmiy Playwright imiji
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# 2. Ishchi papka
WORKDIR /app

# 3. Kutubxonalarni o'rnatish
COPY package*.json ./
RUN npm ci

# 4. Kodlarni ko'chirish
COPY . .

# 5. Loyihani to'g'ridan-to'g'ri ishga tushirish (xvfb-run'siz)
EXPOSE 3000
CMD ["node", "server.js"]