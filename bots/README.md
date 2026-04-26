# GRAVITACIO Bots

Automation scripts for the GRAVITACIO app.

## Fake Activity Bot

Creates 10 fake users and logs random training sessions to make the app look busy.

### Deploy to Railway

1. Create a new service in your Railway project
2. Set the root directory to `bots`
3. Add the `DATABASE_URL` environment variable (same as your backend)
4. Railway will automatically detect the `railway.toml` and run as a cron job

The bot runs daily at 8:00 AM UTC.

### Run Locally

```bash
cd bots
npm install
npx prisma generate
DATABASE_URL="postgresql://..." npm run fake-activity
```

### What it does

1. Creates 10 fake users (if they don't exist) with `bot-*@zoneit.app` emails
2. Each day, randomly picks 2-5 users to be "active"
3. Creates 1-2 training sessions for each active user
4. Sessions have random durations (30-120 min) and exercise counts (8-20)

### Keeping Prisma Schema in Sync

The `prisma/schema.prisma` file must match the backend schema. When you update the backend schema, copy it here:

```bash
cp backend/prisma/schema.prisma bots/prisma/
```

### Fake Users

- Alex Chen
- Jordan Lee
- Sam Rivera
- Taylor Kim
- Morgan Wu
- Casey Patel
- Riley Santos
- Jamie Torres
- Avery Nguyen
- Quinn Davis
