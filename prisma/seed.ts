import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs'; // Password hash karne ke liye best hai

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding started ---');

    // 1. Super Admin Account create karna
    // Note: Password ko hamesha hash karke save karna chahiye
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@burgerarena.com' },
        update: {
            password: "admin123",
        },
        create: {
            name: 'Super Admin',
            email: 'admin@burgerarena.com',
            password: "admin123",
            role: 'admin',
        },
    });

    console.log('✅ Admin account created:', admin.email);

    // 2. Default Settings
    await prisma.settings.upsert({
        where: { id: 'restaurant_config' },
        update: {},
        create: {
            id: 'restaurant_config',
            isOpen: true,
            mode: 'auto',
            openTime: '09:00',
            closeTime: '22:00',
        },
    });
    console.log('✅ Default settings initialized');

    // 3. Basic Menu Category (Testing ke liye)
    const category = await prisma.menu_category.upsert({
        where: { id: 'cat_001' },
        update: {},
        create: {
            id: 'cat_001',
            name: 'Burgers',
            icon: 'hamburger-icon',
        },
    });
    console.log('✅ Sample category created');

    console.log('--- Seeding finished successfully ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });