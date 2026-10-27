import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CostError } from './cost';
import { getUnit, type UnitFamily } from './units';

export type Lang = 'en' | 'fa';

/*
 * Wording rule: Costbook is for anyone who makes and sells something.
 *   Product  = something you make (a dish, a candle, a device, a T-shirt…)
 *   Material = something you buy or pay for (ingredients, parts, packaging, labor, electricity…)
 * In code these are still called 'recipe' and 'ingredient'.
 */
const en = {
  tagline: 'What does it really cost you to make?',
  newRecipe: 'New product',
  'newRecipe.sub': 'something you make',
  newIngredient: 'New material',
  'newIngredient.sub': 'something you buy',
  search: 'Search…',
  'filter.all': 'All',
  'filter.recipe': 'Products',
  'filter.ingredient': 'Materials',
  uncategorized: 'Other',
  noMatch: 'Nothing matches.',
  noItems: 'Nothing here yet.',
  'privacy.saved': 'Saved only on this device',
  'privacy.sub': 'Settings, backup & privacy',
  'privacy.remind': 'Time for a backup',
  saveFailed: "Couldn't save: browser storage is full or blocked. Open this to make a backup.",
  untitled: 'Untitled',
  langSwitch: 'فارسی',

  back: '← List',
  backTo: '← Back to {name}',
  'kind.recipe': 'Product',
  'kind.ingredient': 'Material',
  print: 'Print',
  duplicate: 'Duplicate',
  copySuffix: '(copy)',
  delete: 'Delete',
  'name.recipe.ph': 'Product name',
  'name.ingredient.ph': 'Material name',
  name: 'Name',
  category: 'Group',
  'category.ph': 'Optional, e.g. Menu',
  confirmDelete: 'Delete “{name}”?',
  confirmDeleteBody: 'It will be removed from this device. This can’t be undone.',
  confirmDeleteUsed: 'It is used in: {list}. It will be removed from those products too.',
  cancel: 'Cancel',
  notes: 'Notes',
  'notes.ph': 'Supplier, method, anything you want to remember…',
  usedIn: 'Used in',
  notUsed: 'Not used in any product yet.',

  whatYouPay: 'What you pay for it',
  'material.intro': 'Enter the price you pay and how much you get for it. Costbook works out the price per unit.',
  'price.label': 'Price you pay',
  'pack.label': 'For this amount',
  'buy.hint1': 'A 25 kg bag: the price of the bag, and 25 kg.',
  'buy.hint2': 'A box of 100 screws: the price of the box, and 100 pcs.',
  'buy.hint3': 'Your work: your hourly wage, and 1 hour. Electricity: the price of 1 kWh.',
  pricePer: '{price} per {unit}',

  costPer: 'Your cost per {unit}',
  costExplain: 'Sell above this and you make a profit. Below it, you lose money.',
  batch: 'for {qty} {unit}',
  sellPrice: 'Your selling price per {unit}',
  profitPer: 'Your profit per {unit}',
  margin: 'Margin {m} · cost is {c} of the price',
  enterSell: 'Enter your selling price to see your profit',
  loss: 'You lose {x} on each one',
  components: 'What goes into it',
  'components.hint':
    'Add every material this product uses, with the amount. Count packaging, your work and electricity too. You can also add another product, like a sauce in a dish or a board in a device, and its full cost comes with it.',
  'yield.title': 'How many does this make?',
  'yield.hint': 'If the amounts above make 12 pieces, enter 12. If they make one, leave 1.',
  batchMakes: 'The amounts above make',
  'col.item': 'Item',
  'col.amount': 'Amount',
  'col.cost': 'Cost',
  total: 'Total',
  setPrice: 'Set its price →',
  remove: 'Remove',
  deleted: 'Deleted item',
  open: 'Open',
  addPh: 'Type to add a material or another product…',
  addLabel: 'Add a material or product',
  createIngredient: 'New material:',
  createRecipe: 'New product:',
  emptyLines: 'Type the first material in the box below, for example “flour” or “wax”. If it’s new, you can create it right there.',
  'guide.title': 'Start here',
  'guide.1': 'Add the materials it uses',
  'guide.2': 'Say how many it makes',
  'guide.3': 'See your cost and set your price',

  'pricing.title': 'What should I charge?',
  'pricing.hint':
    'A common rule: cafés and restaurants keep cost at 25–35% of the price; shops and makers often sell at 2–3× their cost. Tap one to use it as your price.',
  'pricing.costShare': 'Cost = {p} of price',
  'pricing.markup': '{x}× your cost',
  'pricing.use': 'Use',
  'pricing.profit': 'profit {x}',
  'pricing.current': 'Current',
  'pricing.custom': 'Custom: cost should be',
  'pricing.ofPrice': '% of price',

  'quick.title': 'Bigger orders',
  'quick.costOf': 'Cost of',
  'quick.sells': 'sells for {x}, profit {p}',

  'breakdown.title': 'Full breakdown per {unit}',
  'breakdown.hint': 'Tap a product inside to see what it contains.',

  'err.missing': 'This item was deleted',
  'err.loop': '“{name}” is used inside itself',
  'err.unknownUnit': 'Unknown unit',
  'err.packZero': 'Amount must be more than 0',
  'err.badPrice': 'Price is not valid',
  'err.yieldZero': 'How many it makes must be more than 0',
  'err.badAmount': 'Amount is not valid',
  'err.unitMismatch': 'Wrong unit: {name} is measured in {unit}',
  'err.inside': '{name}: {inner}',

  'welcome.title': 'Know exactly what each product costs you',
  'welcome.lead':
    'Enter what you pay for your materials once, then list what each product uses. Costbook adds it all up and shows your cost per piece. Whatever you charge above that is profit.',
  'step1.t': 'Add your materials',
  'step1.d': 'Anything you buy or pay for, with its price: flour, fabric, wax, screws, packaging, electricity, an hour of work.',
  'step2.t': 'Create a product',
  'step2.d': 'Pick the materials it uses and how much. A product can include another product, like a sauce in a dish or a board in a device.',
  'step3.t': 'See your cost and profit',
  'step3.d': 'Cost per piece, profit at your price, and suggested selling prices.',
  'welcome.start': 'Start with my own product',
  'welcome.examples': 'Or look at a ready-made example',
  'ex.food': 'Café or restaurant',
  'ex.food.sub': 'pizza with its own dough and sauce',
  'ex.craft': 'Handmade goods',
  'ex.craft.sub': 'scented candles',
  'ex.tech': 'Electronics & 3D printing',
  'ex.tech.sub': 'a small device with a printed case',
  'welcome.private': 'Your data never leaves this device. No account, no server, no tracking.',
  selectPrompt: 'Pick something from the list, or create a new product.',

  'data.title': 'Settings & your data',
  'data.privacy.title': 'Private by design',
  'data.privacy.body':
    'Everything you enter is stored only in this browser, on this device. The app has no server, and the browser is told to block it from sending anything over the internet. The code is public on GitHub, so anyone, or any AI, can check this.',
  'data.backup.title': 'Backup',
  'data.backup.body':
    'Browsers can delete saved data, for example when you clear your history, or Safari after 7 days without a visit. Download a backup file now and then and keep it somewhere safe. The same file moves your data to another phone or computer.',
  'data.export': 'Download backup file',
  'data.import': 'Restore from backup file',
  'data.importConfirm.title': 'Replace your items?',
  'data.importConfirm': 'Everything here will be replaced with the {n} items in this file.',
  'data.importConfirm.ok': 'Replace',
  'data.importBad': 'This file is not a valid Costbook backup.',
  'data.importDone': 'Restored {n} items.',
  'data.lastBackup': 'Last backup: {date}',
  'data.neverBackup': 'No backup yet',
  'currency.title': 'Currency',
  'currency.symbol': 'Symbol or name',
  'currency.position': 'Position',
  'currency.before': 'Before the number ($12)',
  'currency.after': 'After the number (12 €)',
  'lang.title': 'Language',
  'data.more': 'More',
  'data.example': 'Add example items',
  'data.erase': 'Erase everything',
  'data.eraseConfirm.title': 'Erase everything?',
  'data.eraseConfirm': 'All items will be deleted from this device. This can’t be undone. Download a backup first if you might need them.',
  'install.title': 'Install as an app',
  'install.body': 'Costbook gets its own icon and window, and opens even without internet. Your items stay the same.',
  'install.button': 'Install app',
  'install.ios': 'On iPhone or iPad: tap the Share button, then “Add to Home Screen”.',
  'install.done': 'Installed. Open Costbook from your home screen or app list.',
  'install.unsupported': 'This browser can’t install apps. Open this page in Chrome, Edge or Safari to install it. The website works the same either way.',
  close: 'Close',

  'fam.mass': 'Weight',
  'fam.volume': 'Volume',
  'fam.count': 'Count',
  'fam.length': 'Length',
  'fam.area': 'Area',
  'fam.energy': 'Energy',
  'fam.time': 'Time',
  'map.title': 'Map',
  'map.open': 'Map of everything',
  'map.sub': 'See what goes into what',
  'map.show': 'Show on the map',
  'map.hint': 'Tap any dot to see what it is made of and where it is used. Drag to move around, scroll or pinch to zoom.',
  'map.material': 'Materials (bought)',
  'map.part': 'Made here, used in others',
  'map.product': 'Final products',
  'map.stats': '{m} materials · {p} made in between · {f} final products',
  'map.find': 'Find on the map…',
  'map.zoomIn': 'Zoom in',
  'map.zoomOut': 'Zoom out',
  'map.fit': 'Show everything',
  'map.cost': 'Cost',
  'map.sells': 'Sells for {price}. Cost is {pct} of it.',
  'map.reach': 'If its price goes up, {n} final products cost more.',
  'map.depth': 'Made from {n} things in total, all the way down.',
  'map.biggest': 'Where the cost goes',
  'map.usedIn': 'Used in',
  'map.openItem': 'Open',
  'map.empty': 'Add a few products and materials first. The map shows how they connect.',
};

export type Key = keyof typeof en;

const fa: Record<Key, string> = {
  tagline: 'ساختنش واقعاً چقدر برایتان تمام می‌شود؟',
  newRecipe: 'محصول جدید',
  'newRecipe.sub': 'چیزی که می‌سازید',
  newIngredient: 'مادهٔ اولیهٔ جدید',
  'newIngredient.sub': 'چیزی که می‌خرید',
  search: 'جستجو…',
  'filter.all': 'همه',
  'filter.recipe': 'محصولات',
  'filter.ingredient': 'مواد اولیه',
  uncategorized: 'سایر',
  noMatch: 'چیزی پیدا نشد.',
  noItems: 'هنوز چیزی اضافه نکرده‌اید.',
  'privacy.saved': 'فقط روی همین دستگاه ذخیره می‌شود',
  'privacy.sub': 'تنظیمات، پشتیبان و حریم خصوصی',
  'privacy.remind': 'وقت گرفتن پشتیبان است',
  saveFailed: 'ذخیره نشد: حافظهٔ مرورگر پر یا مسدود است. برای گرفتن پشتیبان این‌جا را باز کنید.',
  untitled: 'بی‌نام',
  langSwitch: 'English',

  back: '→ فهرست',
  backTo: '→ بازگشت به {name}',
  'kind.recipe': 'محصول',
  'kind.ingredient': 'مادهٔ اولیه',
  print: 'چاپ',
  duplicate: 'کپی',
  copySuffix: '(کپی)',
  delete: 'حذف',
  'name.recipe.ph': 'نام محصول',
  'name.ingredient.ph': 'نام ماده',
  name: 'نام',
  category: 'گروه',
  'category.ph': 'اختیاری، مثلاً منو',
  confirmDelete: '«{name}» حذف شود؟',
  confirmDeleteBody: 'از این دستگاه پاک می‌شود و برنمی‌گردد.',
  confirmDeleteUsed: 'در این محصولات استفاده شده: {list}. از آن‌ها هم حذف می‌شود.',
  cancel: 'انصراف',
  notes: 'یادداشت',
  'notes.ph': 'تأمین‌کننده، روش کار یا هر چیزی که می‌خواهید یادتان بماند…',
  usedIn: 'استفاده‌شده در',
  notUsed: 'هنوز در هیچ محصولی استفاده نشده.',

  whatYouPay: 'قیمت خرید',
  'material.intro': 'قیمتی را که می‌پردازید و مقداری را که در ازایش می‌گیرید بنویسید. قیمت هر واحد خودکار حساب می‌شود.',
  'price.label': 'قیمتی که می‌پردازید',
  'pack.label': 'برای این مقدار',
  'buy.hint1': 'کیسهٔ ۲۵ کیلویی: قیمت کیسه و ۲۵ کیلوگرم.',
  'buy.hint2': 'جعبهٔ ۱۰۰تایی پیچ: قیمت جعبه و ۱۰۰ عدد.',
  'buy.hint3': 'کار خودتان: دستمزد یک ساعت و ۱ ساعت. برق: قیمت ۱ کیلووات‌ساعت.',
  pricePer: 'هر {unit}: {price}',

  costPer: 'هزینهٔ شما برای هر {unit}',
  costExplain: 'بالاتر از این بفروشید سود می‌کنید؛ پایین‌تر از آن ضرر.',
  batch: 'برای {qty} {unit}',
  sellPrice: 'قیمت فروش شما برای هر {unit}',
  profitPer: 'سود شما از هر {unit}',
  margin: 'حاشیهٔ سود {m} · هزینه {c} از قیمت فروش است',
  enterSell: 'قیمت فروش را وارد کنید تا سودتان را ببینید',
  loss: 'روی هر کدام {x} ضرر می‌کنید',
  components: 'چه چیزهایی در آن به کار می‌رود',
  'components.hint':
    'هر ماده‌ای را که این محصول مصرف می‌کند با مقدارش اضافه کنید. بسته‌بندی، دستمزد و برق را هم حساب کنید. محصول دیگری را هم می‌توانید اضافه کنید، مثل سس در یک غذا یا برد در یک دستگاه، تا کل هزینه‌اش حساب شود.',
  'yield.title': 'چند عدد از آن درمی‌آید؟',
  'yield.hint': 'اگر مقدارهای بالا ۱۲ عدد درمی‌آورد، ۱۲ بنویسید. اگر یک عدد درمی‌آید، همان ۱ بماند.',
  batchMakes: 'مقدارهای بالا درمی‌آورد',
  'col.item': 'قلم',
  'col.amount': 'مقدار',
  'col.cost': 'هزینه',
  total: 'جمع',
  setPrice: 'قیمتش را وارد کنید ←',
  remove: 'حذف',
  deleted: 'قلم حذف‌شده',
  open: 'باز کردن',
  addPh: 'برای افزودن ماده یا محصول دیگر تایپ کنید…',
  addLabel: 'افزودن ماده یا محصول',
  createIngredient: 'مادهٔ اولیهٔ جدید:',
  createRecipe: 'محصول جدید:',
  emptyLines: 'اولین ماده را در کادر زیر بنویسید، مثلاً «آرد» یا «پارافین». اگر جدید است، همان‌جا می‌توانید بسازیدش.',
  'guide.title': 'از این‌جا شروع کنید',
  'guide.1': 'مواد مصرفی‌اش را اضافه کنید',
  'guide.2': 'بگویید چند عدد درمی‌آید',
  'guide.3': 'هزینه را ببینید و قیمت بگذارید',

  'pricing.title': 'به چه قیمتی بفروشم؟',
  'pricing.hint':
    'یک قاعدهٔ رایج: کافه و رستوران هزینه را ۲۵ تا ۳۵ درصد قیمت فروش نگه می‌دارند؛ فروشگاه‌ها و تولیدکننده‌ها اغلب ۲ تا ۳ برابر هزینه می‌فروشند. روی هر کدام بزنید تا قیمت فروشتان شود.',
  'pricing.costShare': 'هزینه = {p} قیمت',
  'pricing.markup': '{x} برابر هزینه',
  'pricing.use': 'انتخاب',
  'pricing.profit': 'سود {x}',
  'pricing.current': 'فعلی',
  'pricing.custom': 'دلخواه: هزینه باشد',
  'pricing.ofPrice': 'درصد قیمت',

  'quick.title': 'سفارش‌های بزرگ‌تر',
  'quick.costOf': 'هزینهٔ',
  'quick.sells': 'فروش {x}، سود {p}',

  'breakdown.title': 'ریز هزینه برای هر {unit}',
  'breakdown.hint': 'روی محصولی که داخل آن است بزنید تا اجزایش را ببینید.',

  'err.missing': 'این قلم حذف شده است',
  'err.loop': '«{name}» داخل خودش استفاده شده',
  'err.unknownUnit': 'واحد نامعتبر',
  'err.packZero': 'مقدار باید بیشتر از صفر باشد',
  'err.badPrice': 'قیمت معتبر نیست',
  'err.yieldZero': 'تعداد تولید باید بیشتر از صفر باشد',
  'err.badAmount': 'مقدار معتبر نیست',
  'err.unitMismatch': 'واحد نادرست: {name} با {unit} اندازه‌گیری می‌شود',
  'err.inside': '{name}: {inner}',

  'welcome.title': 'بدانید هر محصول دقیقاً چقدر برایتان تمام می‌شود',
  'welcome.lead':
    'قیمت خرید مواد را یک بار وارد کنید و بگویید هر محصول چه چیزهایی مصرف می‌کند. Costbook همه را جمع می‌زند و هزینهٔ هر عدد را نشان می‌دهد؛ هر چه بالاتر از آن بفروشید، سود شماست.',
  'step1.t': 'مواد اولیه را وارد کنید',
  'step1.d': 'هر چیزی که می‌خرید یا هزینه‌اش را می‌دهید، با قیمتش: آرد، پارچه، پارافین، پیچ، بسته‌بندی، برق، یک ساعت کار.',
  'step2.t': 'محصول بسازید',
  'step2.d': 'مواد مصرفی و مقدارشان را انتخاب کنید. یک محصول می‌تواند محصول دیگری را هم در خودش داشته باشد، مثل سس در غذا یا برد در دستگاه.',
  'step3.t': 'هزینه و سود را ببینید',
  'step3.d': 'هزینهٔ هر عدد، سود با قیمت فروش خودتان و قیمت‌های پیشنهادی.',
  'welcome.start': 'با محصول خودم شروع می‌کنم',
  'welcome.examples': 'یا یک نمونهٔ آماده را ببینید',
  'ex.food': 'کافه و رستوران',
  'ex.food.sub': 'پیتزا با خمیر و سس خانگی',
  'ex.craft': 'کار دستی',
  'ex.craft.sub': 'شمع معطر',
  'ex.tech': 'الکترونیک و پرینت سه‌بعدی',
  'ex.tech.sub': 'یک دستگاه کوچک با بدنهٔ پرینتی',
  'welcome.private': 'اطلاعات شما هیچ‌وقت از این دستگاه خارج نمی‌شود. بدون حساب کاربری، بدون سرور، بدون ردیابی.',
  selectPrompt: 'یکی را از فهرست انتخاب کنید یا محصول جدیدی بسازید.',

  'data.title': 'تنظیمات و اطلاعات شما',
  'data.privacy.title': 'خصوصی از پایه',
  'data.privacy.body':
    'هر چه وارد می‌کنید فقط در مرورگرِ همین دستگاه ذخیره می‌شود. برنامه سروری ندارد و به مرورگر گفته شده جلوی ارسال هر نوع داده به اینترنت را بگیرد. کد برنامه در گیت‌هاب عمومی است و هر کسی، یا هر هوش مصنوعی، می‌تواند این را بررسی کند.',
  'data.backup.title': 'پشتیبان‌گیری',
  'data.backup.body':
    'مرورگر ممکن است اطلاعات ذخیره‌شده را پاک کند؛ مثلاً وقتی تاریخچه را پاک می‌کنید، یا سافاری اگر ۷ روز سر نزنید. هر چند وقت یک بار فایل پشتیبان بگیرید و جای امنی نگهش دارید. با همین فایل می‌توانید اطلاعات را به گوشی یا کامپیوتر دیگری هم ببرید.',
  'data.export': 'دانلود فایل پشتیبان',
  'data.import': 'بازگردانی از فایل پشتیبان',
  'data.importConfirm.title': 'اطلاعات فعلی جایگزین شود؟',
  'data.importConfirm': 'همهٔ اطلاعات فعلی با {n} قلمِ این فایل جایگزین می‌شود.',
  'data.importConfirm.ok': 'جایگزین کن',
  'data.importBad': 'این فایل پشتیبان معتبری برای این برنامه نیست.',
  'data.importDone': '{n} قلم بازگردانی شد.',
  'data.lastBackup': 'آخرین پشتیبان: {date}',
  'data.neverBackup': 'هنوز پشتیبانی نگرفته‌اید',
  'currency.title': 'واحد پول',
  'currency.symbol': 'نماد یا نام',
  'currency.position': 'جایگاه',
  'currency.before': 'قبل از عدد ($12)',
  'currency.after': 'بعد از عدد (۱۲ تومان)',
  'lang.title': 'زبان',
  'data.more': 'بیشتر',
  'data.example': 'افزودن اقلام نمونه',
  'data.erase': 'پاک کردن همه‌چیز',
  'data.eraseConfirm.title': 'همه‌چیز پاک شود؟',
  'data.eraseConfirm': 'همهٔ اقلام از این دستگاه پاک می‌شود و برنمی‌گردد. اگر ممکن است لازمشان داشته باشید، اول پشتیبان بگیرید.',
  'install.title': 'نصب به‌عنوان برنامه',
  'install.body': 'Costbook آیکون و پنجرهٔ خودش را می‌گیرد و بدون اینترنت هم باز می‌شود. اقلامتان همان می‌ماند.',
  'install.button': 'نصب برنامه',
  'install.ios': 'در آیفون یا آیپد: دکمهٔ اشتراک‌گذاری را بزنید، بعد «افزودن به صفحهٔ اصلی» را انتخاب کنید.',
  'install.done': 'نصب شد. Costbook را از صفحهٔ اصلی یا فهرست برنامه‌ها باز کنید.',
  'install.unsupported': 'این مرورگر نمی‌تواند برنامه نصب کند. برای نصب، این صفحه را در Chrome یا Edge یا Safari باز کنید. وب‌سایت در هر حال همین‌طور کار می‌کند.',
  close: 'بستن',

  'fam.mass': 'وزن',
  'fam.volume': 'حجم',
  'fam.count': 'تعداد',
  'fam.length': 'طول',
  'fam.area': 'مساحت',
  'fam.energy': 'انرژی',
  'fam.time': 'زمان',
  'map.title': 'نقشه',
  'map.open': 'نقشهٔ همه‌چیز',
  'map.sub': 'ببینید چه چیزی در چه چیزی به کار رفته',
  'map.show': 'نمایش روی نقشه',
  'map.hint': 'روی هر نقطه بزنید تا ببینید از چه ساخته شده و کجا به کار رفته. برای جابه‌جایی بکشید، برای بزرگ‌نمایی اسکرول کنید یا دو انگشتی باز کنید.',
  'map.material': 'مواد اولیه (خرید)',
  'map.part': 'نیمه‌آماده (درون محصولات دیگر)',
  'map.product': 'محصول نهایی',
  'map.stats': '{m} مادهٔ اولیه · {p} نیمه‌آماده · {f} محصول نهایی',
  'map.find': 'پیدا کردن روی نقشه…',
  'map.zoomIn': 'بزرگ‌نمایی',
  'map.zoomOut': 'کوچک‌نمایی',
  'map.fit': 'نمایش همه',
  'map.cost': 'هزینه',
  'map.sells': 'قیمت فروش {price}. هزینه {pct} آن است.',
  'map.reach': 'اگر گران شود، هزینهٔ {n} محصول نهایی بالا می‌رود.',
  'map.depth': 'روی هم از {n} چیز ساخته شده.',
  'map.biggest': 'هزینه کجا می‌رود',
  'map.usedIn': 'به کار رفته در',
  'map.openItem': 'باز کردن',
  'map.empty': 'اول چند محصول و مادهٔ اولیه اضافه کنید. نقشه نشان می‌دهد چطور به هم وصل‌اند.',
};

const DICTS: Record<Lang, Record<Key, string>> = { en, fa };
const LANG_KEY = 'costbook:lang';

export type T = (key: Key, vars?: Record<string, string | number>) => string;

interface I18n {
  lang: Lang;
  locale: string;
  dir: 'ltr' | 'rtl';
  setLang: (l: Lang) => void;
  t: T;
  /** Unit label for amounts: "250 g", "3 pcs". */
  unit: (id: string) => string;
  /** Unit label after "per": "per piece", "per kg". */
  unitOne: (id: string) => string;
  family: (f: UnitFamily) => string;
  error: (e: CostError) => string;
}

/** English singular forms for "per …" phrases. */
const EN_ONE: Record<string, string> = { pcs: 'piece', hundred: '100 pcs' };

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'fa') return saved;
  } catch {
    /* storage blocked */
  }
  return navigator.language?.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

const Ctx = createContext<I18n | null>(null);

export function useI18n(): I18n {
  const c = useContext(Ctx);
  if (!c) throw new Error('useI18n outside provider');
  return c;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* storage blocked */
    }
  }, []);

  const value = useMemo<I18n>(() => {
    const dict = DICTS[lang];
    const t: T = (key, vars) => {
      let s = dict[key] ?? en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
      return s;
    };
    const unit = (id: string) => {
      const u = getUnit(id);
      return u ? u[lang] : id;
    };
    const unitOne = (id: string) => (lang === 'en' && EN_ONE[id]) || unit(id);
    const error = (e: CostError): string => {
      switch (e.code) {
        case 'loop':
          return t('err.loop', { name: e.name });
        case 'unitMismatch':
          return t('err.unitMismatch', { name: e.name, unit: unit(e.unit) });
        case 'inside':
          return t('err.inside', { name: e.name, inner: error(e.inner) });
        default:
          return t(`err.${e.code}` as Key);
      }
    };
    return {
      lang,
      locale: lang === 'fa' ? 'fa-IR' : 'en-US',
      dir: lang === 'fa' ? 'rtl' : 'ltr',
      setLang,
      t,
      unit,
      unitOne,
      family: (f) => t(`fam.${f}` as Key),
      error,
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
