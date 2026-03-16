import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_NAMES_HI = [
  'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर',
];

const MONTH_NAMES_UR = [
  'جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون',
  'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر',
];

export function getMonthName(month: number, lang: 'en' | 'hi' | 'ur' = 'en'): string {
  const names = lang === 'hi' ? MONTH_NAMES_HI : lang === 'ur' ? MONTH_NAMES_UR : MONTH_NAMES_EN;
  return names[month - 1] || '';
}

export function generateWhatsAppLink(
  phone: string,
  message: string,
  countryCode: string = '91'
): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const fullPhone = cleanPhone.startsWith(countryCode) ? cleanPhone : `${countryCode}${cleanPhone}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

export function generateReminderMessage(
  mosqueName: string,
  amount: number,
  month: number,
  year: number,
  lang: 'en' | 'hi' | 'ur' = 'en'
): string {
  const monthName = getMonthName(month, lang);
  const formattedAmount = formatCurrency(amount);

  if (lang === 'hi') {
    return `अस्सलामु अलैकुम! ${mosqueName} के लिए ${monthName} ${year} की ${formattedAmount} की मासिक राशि का भुगतान बाकी है। जज़ाकल्लाह खैर।`;
  }
  if (lang === 'ur') {
    return `السلام علیکم! ${mosqueName} کے لیے ${monthName} ${year} کی ${formattedAmount} ماہانہ رقم کی ادائیگی باقی ہے۔ جزاک اللہ خیر۔`;
  }
  return `Assalamu Alaikum! This is a reminder for your monthly contribution of ${formattedAmount} for ${mosqueName} for ${monthName} ${year}. JazakAllah Khair.`;
}
