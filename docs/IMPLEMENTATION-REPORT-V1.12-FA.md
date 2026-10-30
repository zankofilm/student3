# گزارش اجرای اصلاحات مدرسه‌یار دانش‌آموز — V1.12

## انجام‌شده
- نمایش «آخرین بروزرسانی» در داشبورد با تاریخ شمسی و ساعت، به‌صورت پایدار و جدا برای هر دانش‌آموز.
- حذف رفت‌وبرگشت مصنوعی به صفحه «بیشتر» هنگام بروزرسانی.
- دریافت موازی Dashboard و Results و افزودن Timeout به درخواست‌های Sync.
- تشخیص کارنامه‌های واقعاً تغییرکرده با `resultRevision` و `resultUpdatedAt` و جلوگیری از دانلود مجدد Detailهای بدون تغییر.
- نمایش مرحله واقعی Sync در Overlay بروزرسانی.
- پاک‌سازی تمام داده‌های آفلاین حساب قبلی هنگام ورود دانش‌آموز متفاوت: Exam، Draft، Queue، Cache و Profile.
- حفظ داده‌های آفلاین در Logout/Login مجدد همان دانش‌آموز.
- ذخیره Token ورود فقط پس از دریافت موفق Dashboard.
- افزودن `studentId` به Queueهای جدید و فیلتر دفاعی Queue بر اساس حساب فعال.
- Logout آنلاین شامل Unregister دستگاه از Push و Revoke Session سرور؛ UI خروج منتظر شبکه نمی‌ماند.
- دریافت FCM Token چرخش‌یافته در MainActivity از SharedPreferences سرویس Firebase.
- هماهنگی نسخه Android و سرور روی `1.12.0` / `versionCode 12`.
- Release Signing اختیاری و امن در GitHub Actions با Secretها، بدون قرار دادن Keystore در مخزن.
- افزودن `.gitignore` برای Build output، `google-services.json` و فایل‌های امضا.

## تست‌ها
- Syntax: `server.mjs`, `shared/mobile-push.mjs`, `student/app.js`, `girl-dashboard.js`, `girl-sections.js` موفق.
- Workflow YAML معتبر است.
- `node --test tests/*.test.mjs`: **60 موفق / 0 ناموفق**.

## نکته استقرار
`server-integration/INSTALL-ROOT` یک Overlay روی سورس اصلی بک‌اند است و کل سرور مستقل نیست. برای V1.12 باید حداقل تغییرات `student/app.js` و `server.mjs` روی نسخه اصلی سرور اعمال شوند. فایل `shared/mobile-push.mjs` نیز باید در همان ساختار اصلی موجود باشد.

## محدودیت تست محلی
در محیط فعلی Android SDK و Gradle نصب نبودند؛ بنابراین APK واقعی اینجا Build/Install نشد. Workflow `Build Android APK` برای اجرای Build در GitHub Actions آماده است و در صورت تنظیم Secretهای Release، APK امضاشده تولید می‌کند.
