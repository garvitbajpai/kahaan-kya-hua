# Database Setup for Hostinger (MySQL)

## Step 1 — Set your DATABASE_URL in Hostinger environment variables

```
DATABASE_URL="mysql://u357769651_KahaanNews:Aasanhai4321@localhost:3306/u357769651_News"
```

Also set:
```
NEXT_PUBLIC_SITE_NAME="Kahaan Kya Hua"
NEXT_PUBLIC_SITE_URL="https://www.kahaankyahua.com"
ADMIN_SECRET="newsadmin2024"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="newsadmin2024"
ADMIN_SESSION_SECRET="kahaankyahua-admin-session-2026-secure"
```

## Step 2 — After deployment, run DB push

In Hostinger terminal (SSH) inside your project folder:

```bash
npx prisma db push
```

This creates all tables (categories, articles, upload_history) in your MySQL DB.

## Step 3 — Build & Start

```bash
npm install
npm run build
npm run start
```

## Notes

- The `postinstall` script runs `prisma generate` automatically on `npm install`
- No SQLite files are used — everything goes into your MySQL database
- Admin panel: https://yourdomain.com/admin/login
- Password: `newsadmin2024` (change ADMIN_SECRET in env vars)
