# IELTS Writing + Reading + Listening

Mavjud Writing loyihasiga yuborilgan Reading va Listening namunalari qo‘shildi.

## O‘quvchi oqimi

1. Bosh sahifada ism-familiya yoziladi.
2. Writing, Reading yoki Listening tanlanadi.
3. Test bajariladi va Submit bosiladi. Reading/Listening vaqti tugasa avtomatik topshiriladi.
4. Telegram tasdiqlasa muvaffaqiyat ko‘rsatiladi. Xato bo‘lsa javoblar brauzerda saqlanadi va “Qayta yuborish” chiqadi.

Telegramga FIO, test turi, vaqt va barcha javoblar yuboriladi. Reading va Listening uchun 40 ballik natija, to‘g‘ri javoblar va har savolning balli ham yuboriladi. Ikki javob tanlanadigan guruhda har bir to‘g‘ri tanlov alohida ball oladi. Qisqa hisobot xabar, uzun hisobot esa barcha matnni saqlagan TXT fayl sifatida keladi. Writing avtomatik baholanmaydi.

## Yangi GitHub repositoryga joylash

Bu alohida yangi loyiha. Eski repository fayllarini almashtirish kerak emas.

1. ZIPni oching va `ielts-test-platform` papkasini VS Code’da oching.
2. Terminalda quyidagilarni bajaring (Node.js 22 kerak):

```bash
npm install
npm test
npm run build
```

3. GitHub’da yangi bo‘sh repository yarating, masalan `ielts-test-platform`. GitHub’da README, license yoki gitignore yaratishni belgilamang: loyiha o‘z fayllarini olib keladi.
4. VS Code terminalida quyidagilarni bajaring. `YOUR_USERNAME` o‘rniga GitHub username’ingizni yozing; boshqa repo nomini tanlasangiz URLni ham o‘zgartiring:

```bash
git init
git add .
git commit -m "Initial IELTS platform: Writing Reading Listening"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ielts-test-platform.git
git push -u origin main
```

## Yangi Netlify saytini sozlash

1. Netlify’da Git orqali yangi loyiha import qiling va yangi repositoryni tanlang.
2. Ildiz papkani base directory sifatida ishlating. `netlify.toml` quyidagilarni belgilaydi:

- Build command: `npm run build`
- Publish directory: `public`
- Functions directory: `netlify/functions`
- Node: 22

3. Yangi Netlify saytiga environment variablelarni qo‘shing:

```text
TELEGRAM_BOT_TOKEN=<bot token>
TELEGRAM_CHAT_ID=<chat yoki guruh ID>
```

Eski Netlify saytidagi sozlamalar yangi saytga avtomatik ko‘chmaydi. Shu bot va chatdan foydalanish mumkin; tokenni avvalgi kodda ochiq saqlagan bo‘lsangiz, yangisini oling. Bot tanlangan chatga yozish huquqiga ega bo‘lishi kerak. Tokenni HTML/JS yoki Gitga yozmang. `.env.example` faqat namuna.

4. Deploy qiling. Variablelarni deploydan keyin qo‘shsangiz, yana deploy qiling.
5. Saytning Admin tugmasidan Writing topshirig‘ini yarating. Yangi saytning Netlify Blobs xotirasi bo‘sh bo‘ladi: eski saytdagi Writing task avtomatik ko‘chmaydi. Mavjud oddiy admin kirish paroli `12345`; bu haqiqiy server autentifikatsiyasi emas.
6. Reading va Listening namunalarini darhol tanlash mumkin. Writing topshirig‘i saqlangandan keyin Writing ham boshlanadi.
7. O‘z FIOingiz bilan sinov testini topshirib, Telegramga xabar kelishini tekshiring.

`public/` buildda hosil bo‘ladi, uni qo‘lda tahrirlamang. Serverdagi javob kalitlari bu papkaga ko‘chirilmaydi. Oddiy GitHub Pages yoki HTML faylini ikki marta bosib ochish Telegram backendini ishlatmaydi; Netlify deploydan foydalaning.

## Testlarni o‘zgartirish

- Writing: avvalgi admin paneli va Netlify Blobs saqlangan.
- Reading: `reading.html` ichida matnlar va savollar.
- Listening: `listening.html` ichida savollar va `audioSource` MP3 manzili. Namunaning tashqi audio manzili saqlangan; audioning mavjudligi o‘sha serverga bog‘liq.
- Javob kalitlari: `netlify/functions/lib/exam-keys.json`. Savollarni almashtirganda kalitlarni ham yangilang.
- Har ikki namunada vaqt hozir 60 daqiqa. HTML `<body>` elementidagi `data-duration="60"` ni kerakli daqiqaga almashtiring.
- Yangi test versiyasida `data-test-id` va `submission.cjs`dagi tekshiriladigan test IDni birga yangilang. Bu avvalgi draft bilan yangi test aralashmasligi uchun kerak.
- Reading/Listening uchun admin builder qo‘shilmagan; bu versiyada yuborilgan namunalar ishlatiladi.

## Tekshiruv va cheklovlar

`npm test` serverdagi baholashni, bo‘sh javoblarni, guruhli javoblarning qisman ballini, noto‘g‘ri so‘rovlarni, Telegram xatosini va uzun Writing matnini fayl sifatida to‘liq yuborishni tekshiradi. Telegram API testlarda almashtirilgan: haqiqiy chatga test xabari yuborilmagan.

Javoblar va vaqt brauzerda saqlanadi; bu proktorlik yoki server nazoratidagi imtihon sessiyasi emas. Bir qurilmani boshqa o‘quvchiga berishda bosh sahifada uning FIOsini kiriting. “Submit”dan keyin javoblar qulflanadi; muvaffaqiyatsiz yuborishda aynan shu javoblar qayta yuboriladi. Tarmoq uzilib, Telegram qabul qilgan bo‘lsa-yu javobi brauzerga yetmasa, qayta urinish nusxa xabar keltirishi mumkin; hisobotdagi Submission ID bir xil urinishni tanishga yordam beradi.

Avvalgi Writing admin paroli brauzer kodida turadigan oddiy tekshiruvligicha qoldi; bu backend autentifikatsiyasi emas. Ushbu o‘zgarish admin huquqlari tizimini qayta qurmaydi.

## Eski token

Yuklangan loyihaning eski `serverless/sendToTelegram.js` faylida bot tokeni kodga yozilgan edi. Bu eski, ishlatilmaydigan fayl yangi loyihaga kiritilmadi; faol Netlify funksiyasi environment variable ishlatadi. Agar eski fayl GitHubga push qilingan bo‘lsa, BotFather orqali tokenni bekor qilib yangisini oling va Netlifydagi `TELEGRAM_BOT_TOKEN`ni yangilang. Faqat fayldan o‘chirish eski Git commitlaridagi tokenni yo‘q qilmaydi.
