# 1. Playwright va Linux kutubxonalari tayyor o'rnatilgan rasmiy qutini olamiz
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# 2. Server ichida loyiha uchun papka ochamiz
WORKDIR /app

# 3. Keshni optimallashtirish uchun package fayllarni ko'chirib, yuklab olamiz
COPY package*.json ./
RUN npm install

# 4. Loyihamizning qolgan barcha kodlarini serverga ko'chiramiz
COPY . .

# 5. Render serverida virtual ekran (Xvfb) yaratib, loyihani ishga tushiramiz
# Bu Render-ga o'xshash ekransiz serverlarda brauzer xatosiz ochilishi uchun kerak
RUN apt-get update && apt-get install -y xvfb

EXPOSE 3000
CMD ["xvfb-run", "--server-args='-screen 0 1280x1024x24'", "node", "server.js"]