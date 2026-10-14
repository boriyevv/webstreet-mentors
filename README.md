# Web Street Mentors

O'qituvchilar davomatini nazorat qilish tizimi (Next.js 14 · Prisma · Tailwind · PWA).

## Ishga tushirish

```bash
npm install
cp .env.example .env      # JWT_SECRET ni uzun tasodifiy qatorga almashtiring
npm run setup             # bazani yaratadi + administratorni qo'shadi
npm run dev               # http://localhost:3000
```

Administrator: login `904435567`, boshlang'ich parol `904435567` (.env dagi ADMIN_PASSWORD).
**Birinchi kirishdan keyin Sozlamalar bo'limidan parolni almashtiring.**

## Muhim
- Kamera va GPS faqat **HTTPS** da (yoki localhost) ishlaydi. Telefonda sinash uchun HTTPS domen kerak.
- Production: `npm run build && npm run start`. SQLite fayl saqlanadigan serverda (VPS) ishlaydi.
  Vercel kabi serverless muhit uchun `prisma/schema.prisma` da `provider = "postgresql"` ga o'tib,
  `DATABASE_URL` ni Postgres'ga yo'naltiring.
- Yuz tanish kutubxonasi (face-api) va modellari jsDelivr CDN dan yuklanadi.
- O'quv markaz koordinatalari, radius (300 m) va kechikish qoidalari: Admin → Sozlamalar.

## Qoidalar
- Check-in: dars boshlanishidan 30 daqiqa oldin ochiladi; 5 daqiqadan keyin "kech".
- Reyting: vaqtida 1 ball, kech 0.7 (15 daq gacha) yoki 0.4, kelmagan 0; erta ketish yoki "ketdim" belgilanmasa −0.1.
- Daraja: ≥95 A'lo, ≥85 Yaxshi, ≥70 Qoniqarli, undan past — Past.
