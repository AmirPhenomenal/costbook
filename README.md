# Costbook: what does it really cost you to make?

[English](#english) · [فارسی](#فارسی)

<a id="english"></a>

A simple, private calculator for the **real cost of anything you make**: a pizza, a cake,
a sauce, a fingerprint scanner, a 3D-printed part. Enter what you pay for your ingredients
or parts once, build your recipes from them, and see exactly what one unit costs you.
Anything you charge above that is profit.

**🔒 Private:** no account, no server, no tracking. Everything stays in your browser on
your device. See [SECURITY.md](SECURITY.md), including a ready-made prompt you can give
to ChatGPT / Claude / Gemini to check this repository for you.

## What you can do

- **Ingredients & parts:** “I pay 18 for a 25 kg bag of flour” → the app knows the price per gram.
  Works for weight, volume, pieces, length, area, **electricity (kWh)** and **labor (hours)**.
- **Recipes inside recipes:** make a *dough* from flour, water, salt and yeast. Then add
  “250 g of dough” to a *pizza*. The pizza's cost includes everything in the dough automatically.
  Change the price of flour once and every recipe updates.
- **Your cost per piece**, big and clear, plus the cost of a whole batch.
- **Profit & margin:** type your selling price and see what you earn on each one.
- **“What should I charge?”** suggestions: food cost at 25 / 30 / 35 % of price, or 2× / 3× cost.
- **Full breakdown:** where every cent goes, down to the last gram of salt.
- **Quick calculator:** “what do 50 pizzas cost me?”
- **English and Farsi** (right-to-left, Persian digits, toman/rial, سیر and مثقال).
- **Install it like an app** (phone or computer). It opens even without internet.
- Light & dark mode, works on phones, printable cost sheets.
- **Backup & restore** to a file, so you can move to another device.

## Use it

Open the website: **https://amirphenomenal.github.io/costbook/**. No sign-up needed.

To install it as an app: press **Install app** (Chrome, Edge, Android), or on iPhone/iPad
use Share → **Add to Home Screen**. The installed app works offline.

## Run it yourself

```bash
npm install
npm run dev        # local development server
npm test           # unit tests for the cost math
npm run build      # type check + build + privacy check → dist/
```

## Publish your own copy on GitHub

1. Fork this repository (or push it to a new repository).
2. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`. The workflow tests, builds, runs the privacy check and publishes the site.

## How it is built

React + TypeScript + Vite. Runtime dependencies: `react`, `react-dom` and
`@headlessui/react` (accessible modals, no network code).

| File | What it does |
|---|---|
| `src/cost.ts` | All cost math (unit conversion, nested recipes, loop detection) |
| `src/storage.ts` | Saving to `localStorage`, backup files, validation of imported files |
| `src/i18n.tsx` | English and Farsi text |
| `src/units.ts` | Units and conversions |
| `vite.config.ts` | Adds the Content-Security-Policy that blocks all network access |
| `pwa/sw.js` | Offline helper for the installed app (only stores the app's own files) |
| `scripts/check-no-network.mjs` | Fails the build if any network code appears |

License: MIT. The Vazirmatn font is under the SIL Open Font License (see `public/fonts`).

---

<div dir="rtl" lang="fa">

<a id="فارسی"></a>

## فارسی

ماشین‌حسابی ساده و خصوصی برای **قیمت تمام‌شدهٔ هر چیزی که می‌سازید**: پیتزا، کیک، سس، دستگاه اسکنر اثر انگشت یا یک قطعهٔ پرینت سه‌بعدی. یک بار قیمت خرید مواد اولیه یا قطعه‌ها را وارد کنید، دستورهایتان را با آن‌ها بسازید و ببینید هر عدد دقیقاً چقدر برایتان تمام می‌شود. هر چه بالاتر از آن بفروشید، سود شماست.

**🔒 خصوصی:** بدون حساب کاربری، بدون سرور، بدون ردیابی. همه‌چیز فقط در مرورگر دستگاه خودتان می‌ماند. فایل [SECURITY.md](SECURITY.md) توضیح می‌دهد چطور، و یک متن آماده دارد که می‌توانید به ChatGPT یا Claude یا Gemini بدهید تا این مخزن را برایتان بررسی کنند.

### امکانات

- **مواد اولیه و قطعه‌ها:** «کیسهٔ ۲۵ کیلویی آرد را ۱٬۸۰۰٬۰۰۰ تومان می‌خرم» و برنامه قیمت هر گرم را می‌داند. وزن، حجم، تعداد، طول، مساحت، **برق (کیلووات‌ساعت)** و **دستمزد (ساعت)** پشتیبانی می‌شود.
- **دستور داخل دستور:** خمیر را از آرد و آب و نمک و خمیرمایه بسازید، بعد «۲۵۰ گرم خمیر» را به پیتزا اضافه کنید. هزینهٔ همهٔ اجزای خمیر خودکار حساب می‌شود. قیمت آرد را یک بار عوض کنید، همهٔ دستورها به‌روز می‌شوند.
- **هزینهٔ هر عدد**، درشت و واضح، به‌همراه هزینهٔ کل یک نوبت تولید.
- **سود و حاشیهٔ سود:** قیمت فروش را بنویسید و ببینید از هر کدام چقدر درمی‌آورید.
- **«به چه قیمتی بفروشم؟»:** پیشنهاد قیمت بر اساس سهم ۲۵، ۳۰ یا ۳۵ درصدی هزینه، یا ۲ و ۳ برابر هزینه.
- **ریز هزینه:** پول کجا خرج می‌شود، تا آخرین گرم نمک.
- **فارسی و انگلیسی** با چینش راست‌به‌چپ، اعداد فارسی، تومان و ریال، سیر و مثقال.
- **نصب مثل یک برنامه** روی گوشی یا کامپیوتر، که بدون اینترنت هم باز می‌شود.
- حالت روشن و تیره، مناسب گوشی، قابل چاپ.
- **پشتیبان‌گیری و بازگردانی** با فایل، برای انتقال به دستگاه دیگر.

### استفاده

وب‌سایت را باز کنید: **https://amirphenomenal.github.io/costbook/** بدون ثبت‌نام.

برای نصب به‌عنوان برنامه، دکمهٔ **نصب برنامه** را بزنید (Chrome، Edge، اندروید). در آیفون و آیپد از دکمهٔ اشتراک‌گذاری، «افزودن به صفحهٔ اصلی» را انتخاب کنید. برنامهٔ نصب‌شده بدون اینترنت هم کار می‌کند.

**یادتان باشد:** پاک کردن اطلاعات مرورگر، اقلام شما را هم پاک می‌کند. هر چند وقت یک بار از بخش تنظیمات فایل پشتیبان بگیرید.

</div>
