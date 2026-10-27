import type { Component, Ingredient, Item, Recipe } from './types';
import { newId } from './types';
import type { Lang } from './i18n';

type Text = [en: string, fa: string];

/**
 * Example items so first-time users can see how everything fits together.
 * English uses US-dollar prices, Persian uses rough toman prices.
 * They are only examples: users should replace them with their own prices.
 */
export function sampleItems(lang: Lang): Record<string, Item> {
  const items: Record<string, Item> = {};
  const now = Date.now();
  const L = (t: Text) => (lang === 'fa' ? t[1] : t[0]);
  const P = (usd: number, toman: number) => (lang === 'fa' ? toman : usd);

  const ing = (name: Text, cat: Text, price: number, packQty: number, packUnit: string, notes: Text = ['', '']): string => {
    const it: Ingredient = {
      id: newId(),
      kind: 'ingredient',
      name: L(name),
      category: L(cat),
      price,
      packQty,
      packUnit,
      notes: L(notes),
      updatedAt: now,
    };
    items[it.id] = it;
    return it.id;
  };
  const rec = (
    name: Text,
    cat: Text,
    lines: [string, number, string][],
    yieldQty: number,
    yieldUnit: string,
    sellPrice: number | null = null,
    notes: Text = ['', ''],
  ): string => {
    const components: Component[] = lines.map(([itemId, qty, unit]) => ({ id: newId(), itemId, qty, unit }));
    const it: Recipe = {
      id: newId(),
      kind: 'recipe',
      name: L(name),
      category: L(cat),
      components,
      yieldQty,
      yieldUnit,
      sellPrice,
      notes: L(notes),
      updatedAt: now,
    };
    items[it.id] = it;
    return it.id;
  };

  // ---- Pizza shop ----
  const C_ING: Text = ['Pizza · ingredients', 'پیتزا · مواد اولیه'];
  const C_PACK: Text = ['Pizza · packaging', 'پیتزا · بسته‌بندی'];
  const C_PREP: Text = ['Pizza · preparations', 'پیتزا · آماده‌سازی'];
  const C_MENU: Text = ['Pizza · menu', 'پیتزا · منو'];

  const flour = ing(['Flour (00)', 'آرد نول'], C_ING, P(18, 1_800_000), 25, 'kg', ['25 kg bag', 'کیسهٔ ۲۵ کیلویی']);
  const water = ing(['Water', 'آب'], C_ING, P(0.02, 2_000), 10, 'l');
  const salt = ing(['Salt', 'نمک'], C_ING, P(1.2, 30_000), 1, 'kg');
  const sugar = ing(['Sugar', 'شکر'], C_ING, P(1.5, 70_000), 1, 'kg');
  const yeast = ing(['Dry yeast', 'خمیرمایه خشک'], C_ING, P(6, 250_000), 500, 'g');
  const oil = ing(['Olive oil', 'روغن زیتون'], C_ING, P(9, 900_000), 1, 'l');
  const tomato = ing(['Canned tomatoes', 'گوجه‌فرنگی کنسروی'], C_ING, P(5.5, 400_000), 2.5, 'kg');
  const mozz = ing(['Mozzarella', 'پنیر موزارلا'], C_ING, P(9, 450_000), 1, 'kg');
  const basil = ing(['Fresh basil', 'ریحان تازه'], C_ING, P(2.5, 40_000), 100, 'g');
  const box = ing(['Pizza box', 'جعبهٔ پیتزا'], C_PACK, P(28, 1_500_000), 100, 'pcs');

  const dough = rec(
    ['Pizza dough', 'خمیر پیتزا'],
    C_PREP,
    [[flour, 1, 'kg'], [water, 650, 'ml'], [salt, 25, 'g'], [sugar, 10, 'g'], [yeast, 7, 'g'], [oil, 30, 'ml']],
    1.7,
    'kg',
    null,
    ['One batch makes about 1.7 kg (about 7 balls of 250 g).', 'هر نوبت حدود ۱٫۷ کیلوگرم خمیر می‌دهد (تقریباً ۷ چانهٔ ۲۵۰ گرمی).'],
  );
  const sauce = rec(
    ['Tomato sauce', 'سس گوجه'],
    C_PREP,
    [[tomato, 1, 'kg'], [salt, 10, 'g'], [oil, 20, 'ml'], [basil, 10, 'g']],
    1,
    'kg',
  );
  rec(
    ['Margherita pizza', 'پیتزا مارگاریتا'],
    C_MENU,
    [[dough, 250, 'g'], [sauce, 90, 'g'], [mozz, 120, 'g'], [basil, 3, 'g'], [oil, 5, 'ml'], [box, 1, 'pcs']],
    1,
    'pcs',
    P(12, 450_000),
  );

  // ---- Electronics product ----
  const C_PARTS: Text = ['Electronics · parts', 'الکترونیک · قطعات'];
  const C_MAT: Text = ['Electronics · materials', 'الکترونیک · مواد'];
  const C_OVER: Text = ['Overheads', 'هزینه‌های جانبی'];
  const C_SUB: Text = ['Electronics · sub-assemblies', 'الکترونیک · نیمه‌آماده'];
  const C_PROD: Text = ['Electronics · products', 'الکترونیک · محصولات'];

  const esp = ing(['ESP32 dev board', 'برد ESP32'], C_PARTS, P(45, 4_000_000), 10, 'pcs', ['Pack of 10', 'بستهٔ ۱۰تایی']);
  const sensor = ing(['Fingerprint sensor (R503)', 'سنسور اثر انگشت R503'], C_PARTS, P(14, 1_200_000), 1, 'pcs');
  const oled = ing(['OLED display 0.96"', 'نمایشگر OLED ۰٫۹۶ اینچ'], C_PARTS, P(15, 1_250_000), 5, 'pcs');
  const batt = ing(['Li-ion battery 1000 mAh', 'باتری لیتیوم‌یون ۱۰۰۰ میلی‌آمپر'], C_PARTS, P(4.5, 350_000), 1, 'pcs');
  const charger = ing(['USB-C charging board', 'ماژول شارژ USB-C'], C_PARTS, P(6, 500_000), 10, 'pcs');
  const screws = ing(['M3 screws', 'پیچ M3'], C_PARTS, P(5, 200_000), 100, 'pcs');
  const pla = ing(['PLA filament', 'فیلامنت PLA'], C_MAT, P(20, 1_500_000), 1, 'kg', ['1 kg spool', 'قرقرهٔ ۱ کیلویی']);
  const power = ing(['Electricity', 'برق'], C_OVER, P(0.15, 1_500), 1, 'kwh');
  const labor = ing(['Labor (assembly)', 'دستمزد مونتاژ'], C_OVER, P(15, 150_000), 1, 'h', ['Hourly wage', 'مزد هر ساعت']);

  const caseId = rec(
    ['3D-printed case', 'بدنهٔ پرینت سه‌بعدی'],
    C_SUB,
    [[pla, 85, 'g'], [power, 0.6, 'kwh']],
    1,
    'pcs',
    null,
    ['5 h print on a ~120 W printer = 0.6 kWh.', '۵ ساعت چاپ با پرینتر حدود ۱۲۰ وات = ۰٫۶ کیلووات‌ساعت.'],
  );
  rec(
    ['Fingerprint scanner', 'دستگاه اسکنر اثر انگشت'],
    C_PROD,
    [
      [esp, 1, 'pcs'],
      [sensor, 1, 'pcs'],
      [oled, 1, 'pcs'],
      [batt, 1, 'pcs'],
      [charger, 1, 'pcs'],
      [caseId, 1, 'pcs'],
      [screws, 6, 'pcs'],
      [labor, 45, 'min'],
    ],
    1,
    'pcs',
    P(60, 6_000_000),
  );

  return items;
}
