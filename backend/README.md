1. cp .env.example .env
2. echo "DATABASE_URL=\"file:$(pwd)/dev.db\"" > .env
3. npx prisma generate
4. npx prisma migrate dev --name init
