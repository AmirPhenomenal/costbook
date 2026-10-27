# Costbook: what does it really cost you to make?

[English](#english) · [فارسی](#فارسی)

<a id="english"></a>

A simple, private calculator for the **real cost of anything you make**: a dish, a cake,
a candle, a T-shirt, a piece of furniture, an electronic device. Enter what you pay for your
**materials** once, list what each **product** uses, and see exactly what one piece costs you.
Anything you charge above that is profit.

**🔒 Private:** no account, no server, no tracking. Everything stays in your browser on
your device. See [SECURITY.md](SECURITY.md), including a ready-made prompt you can give
to ChatGPT / Claude / Gemini to check this repository for you.

## What you can do

- **Materials:** anything you buy or pay for. “I pay 45 for a 10 kg bag of wax” → the app knows
  the price per gram. Works for weight, volume, pieces, length, area, **electricity (kWh)** and
  **your work (hours)**.
- **Products inside products:** make a *dough* and use 250 g of it in a *pizza*, or print a
  *case* and use it in a *device*. The full cost comes along automatically.
  Change the price of a material once and every product updates.
- **Ready-made examples:** a café (pizza), handmade candles, and an electronics device.
- **Your cost per piece**, big and clear, plus the cost of a whole batch.
- **Profit & margin:** type your selling price and see what you earn on each one.
- **“What should I charge?”** suggestions: food cost at 25 / 30 / 35 % of price, or 2× / 3× cost.
- **Full breakdown:** where every cent goes, down to the last gram of salt.
- **Map of everything:** an interactive map of what goes into what. Tap a material to see every
  product it ends up in (and how many get pricier if it does), or a product to see where its cost goes.
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
| `src/graph.ts` | The map: who uses what, cost shares, and the layout |
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

ماشین‌حسابی ساده و خصوصی برای **قیمت تمام‌شدهٔ هر چیزی که می‌سازید**: غذا، کیک، شمع، لباس، مبل یا یک دستگاه الکترونیکی. یک بار قیمت خرید **مواد اولیه** را وارد کنید، بگویید هر **محصول** چه چیزهایی مصرف می‌کند و ببینید هر عدد دقیقاً چقدر برایتان تمام می‌شود. هر چه بالاتر از آن بفروشید، سود شماست.

**🔒 خصوصی:** بدون حساب کاربری، بدون سرور، بدون ردیابی. همه‌چیز فقط در مرورگر دستگاه خودتان می‌ماند. فایل [SECURITY.md](SECURITY.md) توضیح می‌دهد چطور، و یک متن آماده دارد که می‌توانید به ChatGPT یا Claude یا Gemini بدهید تا این مخزن را برایتان بررسی کنند.

### امکانات

- **مواد اولیه:** هر چیزی که می‌خرید یا هزینه‌اش را می‌دهید. «کیسهٔ ۲۵ کیلویی آرد را ۱٬۸۰۰٬۰۰۰ تومان می‌خرم» و برنامه قیمت هر گرم را می‌داند. وزن، حجم، تعداد، طول، مساحت، **برق (کیلووات‌ساعت)** و **دستمزد (ساعت)** پشتیبانی می‌شود.
- **محصول داخل محصول:** خمیر بسازید و ۲۵۰ گرمش را در پیتزا بگذارید، یا بدنه‌ای پرینت کنید و در دستگاه به کار ببرید. کل هزینه‌اش خودکار حساب می‌شود. قیمت یک ماده را یک بار عوض کنید، همهٔ محصولات به‌روز می‌شوند.
- **نمونه‌های آماده:** کافه (پیتزا)، شمع دست‌ساز و یک دستگاه الکترونیکی.
- **هزینهٔ هر عدد**، درشت و واضح، به‌همراه هزینهٔ کل یک نوبت تولید.
- **سود و حاشیهٔ سود:** قیمت فروش را بنویسید و ببینید از هر کدام چقدر درمی‌آورید.
- **«به چه قیمتی بفروشم؟»:** پیشنهاد قیمت بر اساس سهم ۲۵، ۳۰ یا ۳۵ درصدی هزینه، یا ۲ و ۳ برابر هزینه.
- **ریز هزینه:** پول کجا خرج می‌شود، تا آخرین گرم نمک.
- **نقشهٔ همه‌چیز:** نقشه‌ای تعاملی از اینکه چه چیزی در چه چیزی به کار رفته. روی یک مادهٔ اولیه بزنید تا ببینید به کدام محصولات می‌رسد و اگر گران شود هزینهٔ چند محصول بالا می‌رود، یا روی یک محصول تا ببینید هزینه‌اش کجا می‌رود.
- **فارسی و انگلیسی** با چینش راست‌به‌چپ، اعداد فارسی، تومان و ریال، سیر و مثقال.
- **نصب مثل یک برنامه** روی گوشی یا کامپیوتر، که بدون اینترنت هم باز می‌شود.
- حالت روشن و تیره، مناسب گوشی، قابل چاپ.
- **پشتیبان‌گیری و بازگردانی** با فایل، برای انتقال به دستگاه دیگر.

### استفاده

وب‌سایت را باز کنید: **https://amirphenomenal.github.io/costbook/** بدون ثبت‌نام.

برای نصب به‌عنوان برنامه، دکمهٔ **نصب برنامه** را بزنید (Chrome، Edge، اندروید). در آیفون و آیپد از دکمهٔ اشتراک‌گذاری، «افزودن به صفحهٔ اصلی» را انتخاب کنید. برنامهٔ نصب‌شده بدون اینترنت هم کار می‌کند.

**یادتان باشد:** پاک کردن اطلاعات مرورگر، اقلام شما را هم پاک می‌کند. هر چند وقت یک بار از بخش تنظیمات فایل پشتیبان بگیرید.

</div>
