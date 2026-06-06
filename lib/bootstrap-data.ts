import { prisma } from '@/lib/prisma';

export async function ensureMenuAndCouponsSeeded() {
  const [categoryCount, couponCount] = await Promise.all([
    prisma.menu_category.count(),
    prisma.coupon.count(),
  ]);

  if (categoryCount === 0) {
    await prisma.$transaction(async (tx) => {
      const categories = [
        { id: 'cat-burgers', name: 'Burgers', icon: '' },
        { id: 'cat-pizza', name: 'Pizza', icon: '' },
        { id: 'cat-drinks', name: 'Drinks', icon: '' },
      ];

      for (const category of categories) {
        await tx.menu_category.upsert({
          where: { id: category.id },
          update: { name: category.name, icon: category.icon },
          create: category,
        });
      }

      const items = [
        {
          id: 'item-zinger',
          name: 'Zinger Burger',
          price: 499,
          description: 'Crispy chicken fillet burger',
          discount: 10,
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
          restaurant: 'Burger Arena',
          tags: 'Popular,Spicy',
          categoryName: 'Burgers',
          categoryId: 'cat-burgers',
        },
        {
          id: 'item-beef',
          name: 'Beef Smash Burger',
          price: 599,
          description: 'Double beef patty with cheese',
          discount: 0,
          image: 'https://images.unsplash.com/photo-1550547660-d9450f859349',
          restaurant: 'Burger Arena',
          tags: 'Beef,Cheese',
          categoryName: 'Burgers',
          categoryId: 'cat-burgers',
        },
        {
          id: 'item-pepperoni',
          name: 'Pepperoni Pizza',
          price: 1299,
          description: 'Large pepperoni pizza',
          discount: 15,
          image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591',
          restaurant: 'Burger Arena',
          tags: 'Pizza,Family',
          categoryName: 'Pizza',
          categoryId: 'cat-pizza',
        },
        {
          id: 'item-cola',
          name: 'Cola',
          price: 149,
          description: 'Chilled soft drink',
          discount: 0,
          image: 'https://images.unsplash.com/photo-1629203432180-71e9b1a6f35a',
          restaurant: 'Burger Arena',
          tags: 'Cold,Drink',
          categoryName: 'Drinks',
          categoryId: 'cat-drinks',
        },
      ];

      for (const item of items) {
        await tx.menu_item.upsert({
          where: { id: item.id },
          update: item,
          create: item,
        });
      }
    });
  }

  if (couponCount === 0) {
    await prisma.$transaction(async (tx) => {
      await tx.coupon.create({
        data: { code: 'WELCOME10', discount: 10, isActive: true },
      });
      await tx.coupon.create({
        data: { code: 'BURGER20', discount: 20, isActive: false },
      });
    });
  }
}
