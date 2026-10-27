import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CostError } from './cost';
import { getUnit, type UnitFamily } from './units';

export type Lang = 'en' | 'fa';

const en = {
  tagline: 'What does it really cost you to make?',
  newRecipe: '+ Recipe / product',
  newIngredient: '+ Ingredient / part',
  search: 'Search…',
  'filter.all': 'All',
  'filter.recipe': 'Products',
  'filter.ingredient': 'Ingredients',
  uncategorized: 'Uncategorized',
  noMatch: 'Nothing matches.',
  noItems: 'No items yet.',
  'privacy.saved': 'Saved only on this device',
  'privacy.sub': 'Backup, currency & privacy',
  'privacy.remind': 'Time for a backup',
  saveFailed: "Couldn't save: browser storage is full or blocked. Open this to make a backup.",
  untitled: 'Untitled',
  langSwitch: 'فارسی',

  back: '← List',
  'kind.recipe': 'Recipe / product',
  'kind.ingredient': 'Ingredient / part',
  print: 'Print',
  duplicate: 'Duplicate',
  copySuffix: '(copy)',
  delete: 'Delete',
  'name.recipe.ph': 'Name, e.g. Margherita pizza',
  'name.ingredient.ph': 'Name, e.g. Flour',
  name: 'Name',
  category: 'Category',
  'category.ph': 'e.g. Dough, Sauces, Electronics…',
  confirmDelete: 'Delete “{name}”?',
  confirmDeleteUsed: 'Delete “{name}”?\n\nIt is used in: {list}.\nIt will be removed from those too.',
  notes: 'Notes',
  'notes.ph': 'Supplier, method, anything you want to remember…',
  usedIn: 'Used in',
  notUsed: 'Not used in any recipe yet.',

  whatYouPay: 'What you pay',
  'price.label': 'Price you pay',
  'pack.label': 'For this amount',
  'buy.hint1': 'A 25 kg bag of flour: enter the price of the bag and 25 kg.',
  'buy.hint2': 'A pack of 10 boards: the price of the pack and 10 pcs.',
  'buy.hint3': 'Electricity: the price of 1 kWh. Labor: the wage for 1 hour.',
  pricePer: '{price} per {unit}',

  costPer: 'Your cost per {unit}',
  costExplain: 'Sell above this and you make a profit. Below it, you lose money.',
  batch: 'One batch ({qty} {unit})',
  sellPrice: 'Your selling price per {unit}',
  profitPer: 'Your profit per {unit}',
  margin: 'Margin {m} · cost is {c} of the price',
  enterSell: 'Enter your selling price to see your profit',
  loss: 'You lose {x} on each one',
  components: 'What goes into it',
  batchMakes: 'One batch makes',
  'components.hint':
    'Add everything one batch uses: ingredients, packaging, parts, filament, electricity, labor, even a share of rent. You can also add other recipes (like a dough or a sub-assembly) and their full cost comes with them.',
  'col.item': 'Item',
  'col.amount': 'Amount',
  'col.cost': 'Cost',
  total: 'Total for one batch',
  setPrice: 'Set a price →',
  remove: 'Remove',
  deleted: 'Deleted item',
  open: 'Open',
  addPh: 'Add an ingredient, part or another recipe…',
  addLabel: 'Add a component',
  createIngredient: 'New ingredient / part:',
  createRecipe: 'New sub-recipe:',
  emptyLines: 'Nothing added yet. Start typing below to add the first ingredient.',

  'pricing.title': 'What should I charge?',
  'pricing.hint':
    'Restaurants usually keep food cost at 25–35% of the menu price. Makers often sell at 2–3× their cost. Pick one to use it as your selling price.',
  'pricing.costShare': 'Cost = {p} of price',
  'pricing.markup': '{x}× your cost',
  'pricing.use': 'Use',
  'pricing.profit': 'profit {x}',
  'pricing.current': 'Current',
  'pricing.custom': 'Custom: cost should be',
  'pricing.ofPrice': '% of price',

  'quick.title': 'Quick calculator',
  'quick.costOf': 'Cost of',
  'quick.sells': 'sells for {x}, profit {p}',

  'breakdown.title': 'Full breakdown per {unit}',
  'breakdown.hint': 'Tap a sub-recipe to see what is inside it.',

  'err.missing': 'This item was deleted',
  'err.loop': '“{name}” is used inside itself',
  'err.unknownUnit': 'Unknown unit',
  'err.packZero': 'Amount must be more than 0',
  'err.badPrice': 'Price is not valid',
  'err.yieldZero': 'Batch amount must be more than 0',
  'err.badAmount': 'Amount is not valid',
  'err.unitMismatch': 'Wrong unit: {name} is measured in {unit}',
  'err.inside': '{name}: {inner}',

  'welcome.title': 'Know exactly what each product costs you',
  'welcome.lead':
    'Enter what you pay for ingredients or parts once, then build your recipes from them. Costbook adds everything up, even recipes inside recipes, and shows your cost per piece, so you know what to charge.',
  'step1.t': 'Add what you buy',
  'step1.d': 'Flour, cheese, boxes, electronic modules, filament, electricity, your hourly wage, with the price you pay.',
  'step2.t': 'Build your recipes',
  'step2.d': 'A dough from flour, salt and yeast. A pizza from dough, sauce and cheese. Reuse anything.',
  'step3.t': 'See your real cost',
  'step3.d': 'Cost per piece, your profit at your price, and suggested selling prices.',
  'welcome.example': 'Show me an example',
  'welcome.exampleSub': 'pizza shop + electronics',
  'welcome.start': 'Start from scratch',
  'welcome.private': 'Your recipes never leave this device. No account, no server, no tracking.',
  selectPrompt: 'Pick something from the list, or create a new item.',

  'data.title': 'Settings & your data',
  'data.privacy.title': 'Private by design',
  'data.privacy.body':
    'Everything you enter is stored only in this browser, on this device. The app has no server, and the browser is told to block it from sending anything over the internet. The code is public on GitHub, so anyone, or any AI, can check this.',
  'data.backup.title': 'Backup',
  'data.backup.body':
    'Browsers can delete saved data, for example when you clear your history, or Safari after 7 days without a visit. Download a backup file now and then and keep it somewhere safe. The same file moves your data to another phone or computer.',
  'data.export': 'Download backup file',
  'data.import': 'Restore from backup file',
  'data.importConfirm': 'Replace everything here with the {n} items in this file?',
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
  'data.eraseConfirm': 'Erase ALL items from this device? This cannot be undone. Download a backup first if you might need them.',
  close: 'Close',

  'fam.mass': 'Weight',
  'fam.volume': 'Volume',
  'fam.count': 'Count',
  'fam.length': 'Length',
  'fam.area': 'Area',
  'fam.energy': 'Energy',
  'fam.time': 'Time',
};

export type Key = keyof typeof en;

const fa: Record<Key, string> = {
  tagline: 'ساختنش واقعاً چقدر برایتان تمام می‌شود؟',
  newRecipe: '+ محصول / دستور',
  newIngredient: '+ ماده / قطعه',
  search: 'جستجو…',
  'filter.all': 'همه',
  'filter.recipe': 'محصولات',
  'filter.ingredient': 'مواد اولیه',
  uncategorized: 'بدون دسته',
  noMatch: 'چیزی پیدا نشد.',
  noItems: 'هنوز چیزی اضافه نکرده‌اید.',
  'privacy.saved': 'فقط روی همین دستگاه ذخیره می‌شود',
  'privacy.sub': 'پشتیبان، واحد پول و حریم خصوصی',
  'privacy.remind': 'وقت گرفتن پشتیبان است',
  saveFailed: 'ذخیره نشد: حافظهٔ مرورگر پر یا مسدود است. برای گرفتن پشتیبان این‌جا را باز کنید.',
  untitled: 'بی‌نام',
  langSwitch: 'English',

  back: '→ فهرست',
  'kind.recipe': 'دستور پخت / محصول',
  'kind.ingredient': 'ماده اولیه / قطعه',
  print: 'چاپ',
  duplicate: 'کپی',
  copySuffix: '(کپی)',
  delete: 'حذف',
  'name.recipe.ph': 'نام، مثلاً پیتزا مارگاریتا',
  'name.ingredient.ph': 'نام، مثلاً آرد',
  name: 'نام',
  category: 'دسته',
  'category.ph': 'مثلاً خمیر، سس، قطعات الکترونیکی…',
  confirmDelete: '«{name}» حذف شود؟',
  confirmDeleteUsed: '«{name}» حذف شود؟\n\nدر این موارد استفاده شده: {list}.\nاز آن‌ها هم حذف می‌شود.',
  notes: 'یادداشت',
  'notes.ph': 'تأمین‌کننده، روش کار یا هر چیزی که می‌خواهید یادتان بماند…',
  usedIn: 'استفاده‌شده در',
  notUsed: 'هنوز در هیچ دستوری استفاده نشده.',

  whatYouPay: 'قیمت خرید',
  'price.label': 'قیمتی که می‌پردازید',
  'pack.label': 'برای این مقدار',
  'buy.hint1': 'کیسهٔ ۲۵ کیلویی آرد: قیمت کیسه را بنویسید و مقدار را ۲۵ کیلوگرم بگذارید.',
  'buy.hint2': 'بستهٔ ۱۰تایی برد: قیمت بسته و ۱۰ عدد.',
  'buy.hint3': 'برق: قیمت ۱ کیلووات‌ساعت. دستمزد: مزد ۱ ساعت کار.',
  pricePer: 'هر {unit}: {price}',

  costPer: 'هزینهٔ شما برای هر {unit}',
  costExplain: 'بالاتر از این بفروشید سود می‌کنید؛ پایین‌تر از آن ضرر.',
  batch: 'یک نوبت ({qty} {unit})',
  sellPrice: 'قیمت فروش شما برای هر {unit}',
  profitPer: 'سود شما از هر {unit}',
  margin: 'حاشیهٔ سود {m} · هزینه {c} از قیمت فروش است',
  enterSell: 'قیمت فروش را وارد کنید تا سودتان را ببینید',
  loss: 'روی هر کدام {x} ضرر می‌کنید',
  components: 'چه چیزهایی در آن به کار می‌رود',
  batchMakes: 'هر نوبت تولید',
  'components.hint':
    'هر چیزی را که یک نوبت تولید مصرف می‌کند اضافه کنید: مواد اولیه، بسته‌بندی، قطعه، فیلامنت، برق، دستمزد و حتی سهمی از اجاره. دستورهای دیگر را هم می‌توانید اضافه کنید (مثل خمیر یا یک قطعهٔ نیمه‌آماده) تا کل هزینه‌شان حساب شود.',
  'col.item': 'قلم',
  'col.amount': 'مقدار',
  'col.cost': 'هزینه',
  total: 'جمع یک نوبت',
  setPrice: 'قیمتش را وارد کنید ←',
  remove: 'حذف',
  deleted: 'قلم حذف‌شده',
  open: 'باز کردن',
  addPh: 'ماده اولیه، قطعه یا دستور دیگری اضافه کنید…',
  addLabel: 'افزودن جزء',
  createIngredient: 'مادهٔ اولیه / قطعهٔ جدید:',
  createRecipe: 'دستور نیمه‌آمادهٔ جدید:',
  emptyLines: 'هنوز چیزی اضافه نشده. برای افزودن اولین ماده در کادر زیر تایپ کنید.',

  'pricing.title': 'به چه قیمتی بفروشم؟',
  'pricing.hint':
    'رستوران‌ها معمولاً هزینهٔ مواد را بین ۲۵ تا ۳۵ درصد قیمت منو نگه می‌دارند. تولیدکننده‌ها اغلب ۲ تا ۳ برابر هزینه می‌فروشند. هر کدام را انتخاب کنید، قیمت فروش شما می‌شود.',
  'pricing.costShare': 'هزینه = {p} قیمت',
  'pricing.markup': '{x} برابر هزینه',
  'pricing.use': 'انتخاب',
  'pricing.profit': 'سود {x}',
  'pricing.current': 'فعلی',
  'pricing.custom': 'دلخواه: هزینه باشد',
  'pricing.ofPrice': 'درصد قیمت',

  'quick.title': 'ماشین‌حساب سریع',
  'quick.costOf': 'هزینهٔ',
  'quick.sells': 'فروش {x}، سود {p}',

  'breakdown.title': 'ریز هزینه برای هر {unit}',
  'breakdown.hint': 'روی دستورهای نیمه‌آماده بزنید تا اجزایشان را ببینید.',

  'err.missing': 'این قلم حذف شده است',
  'err.loop': '«{name}» داخل خودش استفاده شده',
  'err.unknownUnit': 'واحد نامعتبر',
  'err.packZero': 'مقدار باید بیشتر از صفر باشد',
  'err.badPrice': 'قیمت معتبر نیست',
  'err.yieldZero': 'مقدار تولید هر نوبت باید بیشتر از صفر باشد',
  'err.badAmount': 'مقدار معتبر نیست',
  'err.unitMismatch': 'واحد نادرست: {name} با {unit} اندازه‌گیری می‌شود',
  'err.inside': '{name}: {inner}',

  'welcome.title': 'بدانید هر محصول دقیقاً چقدر برایتان تمام می‌شود',
  'welcome.lead':
    'یک بار قیمت خرید مواد اولیه یا قطعه‌ها را وارد کنید و دستورهایتان را با آن‌ها بسازید. برنامه همه‌چیز را جمع می‌زند، حتی دستوری که داخل دستور دیگر است، و هزینهٔ هر عدد را نشان می‌دهد تا بدانید به چه قیمتی بفروشید.',
  'step1.t': 'خریدهایتان را وارد کنید',
  'step1.d': 'آرد، پنیر، جعبه، ماژول الکترونیکی، فیلامنت، برق و دستمزد هر ساعت، همراه با قیمتی که می‌پردازید.',
  'step2.t': 'دستورها را بسازید',
  'step2.d': 'خمیر از آرد و نمک و خمیرمایه، پیتزا از خمیر و سس و پنیر. هر چیزی را هر چند بار که خواستید دوباره استفاده کنید.',
  'step3.t': 'هزینهٔ واقعی را ببینید',
  'step3.d': 'هزینهٔ هر عدد، سودتان با قیمت فروش خودتان و قیمت پیشنهادی.',
  'welcome.example': 'یک نمونه نشانم بده',
  'welcome.exampleSub': 'پیتزافروشی و محصول الکترونیکی',
  'welcome.start': 'از صفر شروع می‌کنم',
  'welcome.private': 'دستورهای شما هیچ‌وقت از این دستگاه خارج نمی‌شوند. بدون حساب کاربری، بدون سرور، بدون ردیابی.',
  selectPrompt: 'یکی را از فهرست انتخاب کنید یا قلم جدیدی بسازید.',

  'data.title': 'تنظیمات و اطلاعات شما',
  'data.privacy.title': 'خصوصی از پایه',
  'data.privacy.body':
    'هر چه وارد می‌کنید فقط در مرورگرِ همین دستگاه ذخیره می‌شود. برنامه سروری ندارد و به مرورگر گفته شده جلوی ارسال هر نوع داده به اینترنت را بگیرد. کد برنامه در گیت‌هاب عمومی است و هر کسی، یا هر هوش مصنوعی، می‌تواند این را بررسی کند.',
  'data.backup.title': 'پشتیبان‌گیری',
  'data.backup.body':
    'مرورگر ممکن است اطلاعات ذخیره‌شده را پاک کند؛ مثلاً وقتی تاریخچه را پاک می‌کنید، یا سافاری اگر ۷ روز سر نزنید. هر چند وقت یک بار فایل پشتیبان بگیرید و جای امنی نگهش دارید. با همین فایل می‌توانید اطلاعات را به گوشی یا کامپیوتر دیگری هم ببرید.',
  'data.export': 'دانلود فایل پشتیبان',
  'data.import': 'بازگردانی از فایل پشتیبان',
  'data.importConfirm': 'همهٔ اطلاعات فعلی با {n} قلمِ این فایل جایگزین شود؟',
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
  'data.eraseConfirm': 'همهٔ اقلام از این دستگاه پاک شود؟ این کار برگشت ندارد. اگر ممکن است لازمشان داشته باشید، اول پشتیبان بگیرید.',
  close: 'بستن',

  'fam.mass': 'وزن',
  'fam.volume': 'حجم',
  'fam.count': 'تعداد',
  'fam.length': 'طول',
  'fam.area': 'مساحت',
  'fam.energy': 'انرژی',
  'fam.time': 'زمان',
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
  unit: (id: string) => string;
  family: (f: UnitFamily) => string;
  error: (e: CostError) => string;
}

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
      family: (f) => t(`fam.${f}` as Key),
      error,
    };
  }, [lang, setLang]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
