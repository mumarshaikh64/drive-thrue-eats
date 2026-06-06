export interface MenuItem {
  id: number;
  name: string;
  price: number;
  image: string;
  restaurant: string;
  category: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const categories: Category[] = [
  { id: 'breakfast', name: 'BREAKFAST', icon: '🍳' },
  { id: 'shawarma', name: 'SHAWARMA', icon: '🌯' },
  { id: 'tandoori', name: 'TANDOORI CHICKEN', icon: '🍗' },
  { id: 'pizza', name: 'PIZZA', icon: '🍕' },
  { id: 'burger', name: 'BURGER', icon: '🍔' },
  { id: 'rolls', name: 'ROLLS', icon: '🌮' },
  { id: 'chicken-meals', name: 'CHICKEN MEALS', icon: '🍖' },
  { id: 'momos', name: 'MOMOS', icon: '🥟' },
  { id: 'sandwich', name: 'SANDWICH', icon: '🥪' },
  { id: 'other', name: 'OTHER COURSE', icon: '🍜' },
  { id: 'combos', name: 'COMBOS', icon: '🎁' },
  { id: 'kids', name: 'KIDS MENU', icon: '👶' },
  { id: 'appetizers', name: 'APPETIZERS', icon: '☕' },
  { id: 'salads', name: "SALAD'S", icon: '🥗' },
  { id: 'juices', name: 'JUICES', icon: '🥤' },
  { id: 'shakes', name: 'SHAKES', icon: '🥛' },
  { id: 'icecream', name: 'ICE CREAM / SWEETS', icon: '🍦' },
  { id: 'water', name: 'WATER', icon: '💧' },
];

export const menuItems: MenuItem[] = [
  // BREAKFAST
  { id: 1, name: 'FRENCH FRIES', price: 99, image: 'https://drive-thrueats.online/admin/oimg/img_39.jpg', restaurant: 'Burger Arena', category: 'BREAKFAST', categoryId: 'breakfast' },
  { id: 2, name: 'PERI PERI FRENCH FRIES', price: 110, image: 'https://drive-thrueats.online/admin/oimg/img_44.jpg', restaurant: 'Burger Arena', category: 'BREAKFAST', categoryId: 'breakfast' },
  { id: 3, name: 'TOAST NORMAL (2pc)', price: 20, image: 'https://drive-thrueats.online/admin/oimg/img_45.jpg', restaurant: 'Burger Arena', category: 'BREAKFAST', categoryId: 'breakfast' },
  { id: 4, name: 'BUTTER TOAST (2pc)', price: 25, image: 'https://drive-thrueats.online/admin/oimg/img_46.jpg', restaurant: 'Burger Arena', category: 'BREAKFAST', categoryId: 'breakfast' },
  { id: 5, name: 'FRIED TOAST (1pc)', price: 10, image: 'https://drive-thrueats.online/admin/oimg/img_47.jpg', restaurant: 'Burger Arena', category: 'BREAKFAST', categoryId: 'breakfast' },
  { id: 6, name: 'EGG TOAST (1pc)', price: 25, image: 'https://drive-thrueats.online/admin/oimg/img_48.jpg', restaurant: 'Burger Arena', category: 'BREAKFAST', categoryId: 'breakfast' },
  { id: 7, name: 'Halwa Poori (250 Gm, 2 Poori)', price: 99, image: 'https://drive-thrueats.online/admin/oimg/img_94.jpg', restaurant: 'Burger Arena', category: 'BREAKFAST', categoryId: 'breakfast' },
  // SHAWARMA
  { id: 8, name: 'SHAWARMA', price: 120, image: 'https://drive-thrueats.online/admin/oimg/img_84.jpg', restaurant: 'Burger Arena', category: 'SHAWARMA', categoryId: 'shawarma' },
  { id: 9, name: 'SHAWARMA LARGE', price: 200, image: 'https://drive-thrueats.online/admin/oimg/img_85.jpg', restaurant: 'Burger Arena', category: 'SHAWARMA', categoryId: 'shawarma' },
  { id: 10, name: 'ARABIC SHAWARMA SINGLE', price: 150, image: 'https://drive-thrueats.online/admin/oimg/img_86.jpg', restaurant: 'Burger Arena', category: 'SHAWARMA', categoryId: 'shawarma' },
  { id: 11, name: 'ARABIC SHAWARMA DOUBLE', price: 250, image: 'https://drive-thrueats.online/admin/oimg/img_87.jpg', restaurant: 'Burger Arena', category: 'SHAWARMA', categoryId: 'shawarma' },
  // TANDOORI CHICKEN
  { id: 12, name: 'TANDOORI CHICKEN 1 PC', price: 140, image: 'https://drive-thrueats.online/admin/oimg/img_78.jpg', restaurant: 'Burger Arena', category: 'TANDOORI CHICKEN', categoryId: 'tandoori' },
  { id: 13, name: 'TANDOORI CHICKEN HALF', price: 280, image: 'https://drive-thrueats.online/admin/oimg/img_79.jpg', restaurant: 'Burger Arena', category: 'TANDOORI CHICKEN', categoryId: 'tandoori' },
  { id: 14, name: 'TANDOORI CHICKEN FULL', price: 560, image: 'https://drive-thrueats.online/admin/oimg/img_80.jpg', restaurant: 'Burger Arena', category: 'TANDOORI CHICKEN', categoryId: 'tandoori' },
  // PIZZA
  { id: 15, name: 'Chicken Fajita SMALL', price: 200, image: 'https://drive-thrueats.online/admin/oimg/img_64.jpg', restaurant: 'Burger Arena', category: 'PIZZA', categoryId: 'pizza' },
  { id: 16, name: 'Chicken Fajita MEDIUM', price: 400, image: 'https://drive-thrueats.online/admin/oimg/img_65.jpg', restaurant: 'Burger Arena', category: 'PIZZA', categoryId: 'pizza' },
  { id: 17, name: 'Chicken Fajita LARGE', price: 600, image: 'https://drive-thrueats.online/admin/oimg/img_66.jpg', restaurant: 'Burger Arena', category: 'PIZZA', categoryId: 'pizza' },
  { id: 18, name: 'Chicken Super Supreme SMALL', price: 200, image: 'https://drive-thrueats.online/admin/oimg/img_67.jpg', restaurant: 'Burger Arena', category: 'PIZZA', categoryId: 'pizza' },
  { id: 19, name: 'Chicken Super Supreme MEDIUM', price: 400, image: 'https://drive-thrueats.online/admin/oimg/img_68.jpg', restaurant: 'Burger Arena', category: 'PIZZA', categoryId: 'pizza' },
  { id: 20, name: 'Chicken Super Supreme LARGE', price: 600, image: 'https://drive-thrueats.online/admin/oimg/img_69.jpg', restaurant: 'Burger Arena', category: 'PIZZA', categoryId: 'pizza' },
  { id: 21, name: 'Chicken Barbeque SMALL', price: 210, image: 'https://drive-thrueats.online/admin/oimg/img_70.jpg', restaurant: 'Burger Arena', category: 'PIZZA', categoryId: 'pizza' },
  { id: 22, name: 'Chicken Barbeque MEDIUM', price: 420, image: 'https://drive-thrueats.online/admin/oimg/img_71.jpg', restaurant: 'Burger Arena', category: 'PIZZA', categoryId: 'pizza' },
  { id: 23, name: 'Chicken Barbeque LARGE', price: 650, image: 'https://drive-thrueats.online/admin/oimg/img_72.jpg', restaurant: 'Burger Arena', category: 'PIZZA', categoryId: 'pizza' },
  { id: 24, name: 'VEG PIZZA SMALL', price: 180, image: 'https://drive-thrueats.online/admin/oimg/img_73.jpg', restaurant: 'Burger Arena', category: 'PIZZA', categoryId: 'pizza' },
  { id: 25, name: 'VEG PIZZA MEDIUM', price: 350, image: 'https://drive-thrueats.online/admin/oimg/img_74.jpg', restaurant: 'Burger Arena', category: 'PIZZA', categoryId: 'pizza' },
  { id: 26, name: 'VEG PIZZA LARGE', price: 500, image: 'https://drive-thrueats.online/admin/oimg/img_75.jpg', restaurant: 'Burger Arena', category: 'PIZZA', categoryId: 'pizza' },
  // BURGER
  { id: 27, name: 'ZINGER BURGER', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_5.jpg', restaurant: 'Burger Arena', category: 'BURGER', categoryId: 'burger' },
  { id: 28, name: 'ZINGER KING BURGER', price: 120, image: 'https://drive-thrueats.online/admin/oimg/img_6.jpg', restaurant: 'Burger Arena', category: 'BURGER', categoryId: 'burger' },
  { id: 29, name: 'MAGICIAN BURGER', price: 120, image: 'https://drive-thrueats.online/admin/oimg/img_7.jpg', restaurant: 'Burger Arena', category: 'BURGER', categoryId: 'burger' },
  { id: 30, name: 'PERI PERI BURGER', price: 120, image: 'https://drive-thrueats.online/admin/oimg/img_8.jpg', restaurant: 'Burger Arena', category: 'BURGER', categoryId: 'burger' },
  // ROLLS
  { id: 31, name: 'CRISPY TWISTER', price: 99, image: 'https://drive-thrueats.online/admin/oimg/img_13.jpg', restaurant: 'Burger Arena', category: 'ROLLS', categoryId: 'rolls' },
  { id: 32, name: 'MEXICAN TWISTER', price: 120, image: 'https://drive-thrueats.online/admin/oimg/img_14.jpg', restaurant: 'Burger Arena', category: 'ROLLS', categoryId: 'rolls' },
  { id: 33, name: 'PERI PERI TWISTER', price: 120, image: 'https://drive-thrueats.online/admin/oimg/img_15.jpg', restaurant: 'Burger Arena', category: 'ROLLS', categoryId: 'rolls' },
  { id: 34, name: 'CHICKEN MAX ROLL', price: 120, image: 'https://drive-thrueats.online/admin/oimg/img_51.jpg', restaurant: 'Burger Arena', category: 'ROLLS', categoryId: 'rolls' },
  // CHICKEN MEALS
  { id: 35, name: 'CHICKEN NUGGETS (8pc)', price: 199, image: 'https://drive-thrueats.online/admin/oimg/img_24.jpg', restaurant: 'Burger Arena', category: 'CHICKEN MEALS', categoryId: 'chicken-meals' },
  { id: 36, name: 'CHICKEN POPCORN (20pc)', price: 110, image: 'https://drive-thrueats.online/admin/oimg/img_25.jpg', restaurant: 'Burger Arena', category: 'CHICKEN MEALS', categoryId: 'chicken-meals' },
  { id: 37, name: 'CHICKEN STRIPS (4pc)', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_26.jpg', restaurant: 'Burger Arena', category: 'CHICKEN MEALS', categoryId: 'chicken-meals' },
  { id: 38, name: 'CHICKEN LOLIPOP', price: 199, image: 'https://drive-thrueats.online/admin/oimg/img_42.jpg', restaurant: 'Burger Arena', category: 'CHICKEN MEALS', categoryId: 'chicken-meals' },
  { id: 39, name: 'CHICKEN STRIPS (6pc)', price: 150, image: 'https://drive-thrueats.online/admin/oimg/img_52.jpg', restaurant: 'Burger Arena', category: 'CHICKEN MEALS', categoryId: 'chicken-meals' },
  { id: 40, name: 'CHICKEN WINGS (4pc)', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_53.jpg', restaurant: 'Burger Arena', category: 'CHICKEN MEALS', categoryId: 'chicken-meals' },
  { id: 41, name: 'CHICKEN WINGS (8pc)', price: 199, image: 'https://drive-thrueats.online/admin/oimg/img_54.jpg', restaurant: 'Burger Arena', category: 'CHICKEN MEALS', categoryId: 'chicken-meals' },
  { id: 42, name: 'CRISPY FRIED CHICKEN 1 PC', price: 70, image: 'https://drive-thrueats.online/admin/oimg/img_88.jpg', restaurant: 'Burger Arena', category: 'CHICKEN MEALS', categoryId: 'chicken-meals' },
  { id: 43, name: 'CRISPY FRIED CHICKEN 4 PC', price: 260, image: 'https://drive-thrueats.online/admin/oimg/img_89.jpg', restaurant: 'Burger Arena', category: 'CHICKEN MEALS', categoryId: 'chicken-meals' },
  { id: 44, name: 'CRISPY FRIED CHICKEN 8 PC', price: 520, image: 'https://drive-thrueats.online/admin/oimg/img_91.jpg', restaurant: 'Burger Arena', category: 'CHICKEN MEALS', categoryId: 'chicken-meals' },
  // MOMOS
  { id: 45, name: 'STEAM MOMOS (10pc)', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_55.jpg', restaurant: 'Burger Arena', category: 'MOMOS', categoryId: 'momos' },
  { id: 46, name: 'FRIED MOMOS (10pc)', price: 120, image: 'https://drive-thrueats.online/admin/oimg/img_56.jpg', restaurant: 'Burger Arena', category: 'MOMOS', categoryId: 'momos' },
  // SANDWICH
  { id: 47, name: 'CHICKEN SANDWICH', price: 120, image: 'https://drive-thrueats.online/admin/oimg/img_29.jpg', restaurant: 'Burger Arena', category: 'SANDWICH', categoryId: 'sandwich' },
  { id: 48, name: 'SANDWICH VEG.', price: 99, image: 'https://drive-thrueats.online/admin/oimg/img_30.jpg', restaurant: 'Burger Arena', category: 'SANDWICH', categoryId: 'sandwich' },
  // OTHER COURSE
  { id: 49, name: 'VEG. NOODLES', price: 99, image: 'https://drive-thrueats.online/admin/oimg/img_40.jpg', restaurant: 'Burger Arena', category: 'OTHER COURSE', categoryId: 'other' },
  { id: 50, name: 'CHICKEN BIRYANI', price: 120, image: 'https://drive-thrueats.online/admin/oimg/img_49.jpg', restaurant: 'Burger Arena', category: 'OTHER COURSE', categoryId: 'other' },
  { id: 51, name: 'VEG. BIRYANI', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_50.jpg', restaurant: 'Burger Arena', category: 'OTHER COURSE', categoryId: 'other' },
  { id: 52, name: 'POPCORN', price: 20, image: 'https://drive-thrueats.online/admin/oimg/img_60.jpg', restaurant: 'Burger Arena', category: 'OTHER COURSE', categoryId: 'other' },
  { id: 53, name: 'FISH STRIPS 5 pcs', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_76.jpg', restaurant: 'Burger Arena', category: 'OTHER COURSE', categoryId: 'other' },
  { id: 54, name: 'FISH CUTLETS - 1 PLATE SMALL', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_77.jpg', restaurant: 'Burger Arena', category: 'OTHER COURSE', categoryId: 'other' },
  { id: 55, name: 'LOADED FRIES', price: 149, image: 'https://drive-thrueats.online/admin/oimg/img_90.jpg', restaurant: 'Burger Arena', category: 'OTHER COURSE', categoryId: 'other' },
  // COMBOS
  { id: 56, name: '1 TWISTER + 1 FRIES + 1 JUICE + 1 DIP', price: 220, image: 'https://drive-thrueats.online/admin/oimg/img_61.jpg', restaurant: 'Burger Arena', category: 'COMBOS', categoryId: 'combos' },
  // KIDS MENU
  { id: 57, name: 'French Fries + Chicken Lollipop + Juice + Ketchup', price: 179, image: 'https://drive-thrueats.online/admin/oimg/img_58.jpg', restaurant: 'Burger Arena', category: 'KIDS MENU', categoryId: 'kids' },
  { id: 58, name: 'Fries + Chicken Popcorn + Juice + Ketchup', price: 220, image: 'https://drive-thrueats.online/admin/oimg/img_59.jpg', restaurant: 'Burger Arena', category: 'KIDS MENU', categoryId: 'kids' },
  // APPETIZERS
  { id: 59, name: 'COFFEE SMALL', price: 20, image: 'https://drive-thrueats.online/admin/oimg/img_16.jpg', restaurant: 'Burger Arena', category: 'APPETIZERS', categoryId: 'appetizers' },
  { id: 60, name: 'COFFEE MEDIUM', price: 30, image: 'https://drive-thrueats.online/admin/oimg/img_17.jpg', restaurant: 'Burger Arena', category: 'APPETIZERS', categoryId: 'appetizers' },
  { id: 61, name: 'TEA SMALL', price: 20, image: 'https://drive-thrueats.online/admin/oimg/img_18.jpg', restaurant: 'Burger Arena', category: 'APPETIZERS', categoryId: 'appetizers' },
  { id: 62, name: 'TEA MEDIUM', price: 30, image: 'https://drive-thrueats.online/admin/oimg/img_19.jpg', restaurant: 'Burger Arena', category: 'APPETIZERS', categoryId: 'appetizers' },
  { id: 63, name: 'LEMON TEA SMALL', price: 20, image: 'https://drive-thrueats.online/admin/oimg/img_20.jpg', restaurant: 'Burger Arena', category: 'APPETIZERS', categoryId: 'appetizers' },
  { id: 64, name: 'LEMON TEA MEDIUM', price: 30, image: 'https://drive-thrueats.online/admin/oimg/img_21.jpg', restaurant: 'Burger Arena', category: 'APPETIZERS', categoryId: 'appetizers' },
  { id: 65, name: 'KEHWA KASHMIRI SMALL', price: 20, image: 'https://drive-thrueats.online/admin/oimg/img_22.jpg', restaurant: 'Burger Arena', category: 'APPETIZERS', categoryId: 'appetizers' },
  { id: 66, name: 'KEHWA KASHMIRI MEDIUM', price: 40, image: 'https://drive-thrueats.online/admin/oimg/img_23.jpg', restaurant: 'Burger Arena', category: 'APPETIZERS', categoryId: 'appetizers' },
  { id: 67, name: 'HOT CHOCOLATE', price: 25, image: 'https://drive-thrueats.online/admin/oimg/img_81.jpg', restaurant: 'Burger Arena', category: 'APPETIZERS', categoryId: 'appetizers' },
  { id: 68, name: 'TOMATO SOUP', price: 25, image: 'https://drive-thrueats.online/admin/oimg/img_82.jpg', restaurant: 'Burger Arena', category: 'APPETIZERS', categoryId: 'appetizers' },
  { id: 69, name: 'BLACK COFFEE', price: 25, image: 'https://drive-thrueats.online/admin/oimg/img_83.jpg', restaurant: 'Burger Arena', category: 'APPETIZERS', categoryId: 'appetizers' },
  // SALADS
  { id: 70, name: 'VEG. SALAD (250gm)', price: 75, image: 'https://drive-thrueats.online/admin/oimg/img_27.jpg', restaurant: 'Burger Arena', category: "SALAD'S", categoryId: 'salads' },
  { id: 71, name: 'FRUIT CREAM CHAT (150gm)', price: 149, image: 'https://images.unsplash.com/photo-1568158879083-c42860933ed7?w=400', restaurant: 'Burger Arena', category: "SALAD'S", categoryId: 'salads' },
  { id: 72, name: 'Mango Cream (150gm)', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_92.jpg', restaurant: 'Burger Arena', category: "SALAD'S", categoryId: 'salads' },
  // JUICES
  { id: 73, name: 'MANGO JUICE', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_1.jpg', restaurant: 'Burger Arena', category: 'JUICES', categoryId: 'juices' },
  { id: 74, name: 'ORANGE JUICE', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_2.jpg', restaurant: 'Burger Arena', category: 'JUICES', categoryId: 'juices' },
  { id: 75, name: 'PINE APPLE JUICE', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_3.jpg', restaurant: 'Burger Arena', category: 'JUICES', categoryId: 'juices' },
  { id: 76, name: 'WATERMELON JUICE', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_4.jpg', restaurant: 'Burger Arena', category: 'JUICES', categoryId: 'juices' },
  // SHAKES
  { id: 77, name: 'MANGO SHAKE', price: 130, image: 'https://drive-thrueats.online/admin/oimg/img_9.jpg', restaurant: 'Burger Arena', category: 'SHAKES', categoryId: 'shakes' },
  { id: 78, name: 'BANANA SHAKE', price: 120, image: 'https://drive-thrueats.online/admin/oimg/img_10.jpg', restaurant: 'Burger Arena', category: 'SHAKES', categoryId: 'shakes' },
  { id: 79, name: 'VANILLA SHAKE', price: 100, image: 'https://drive-thrueats.online/admin/oimg/img_11.jpg', restaurant: 'Burger Arena', category: 'SHAKES', categoryId: 'shakes' },
  { id: 80, name: 'CHOCOLATE SHAKE', price: 120, image: 'https://drive-thrueats.online/admin/oimg/img_12.jpg', restaurant: 'Burger Arena', category: 'SHAKES', categoryId: 'shakes' },
  { id: 81, name: 'Fruit Falooda (200gm)', price: 200, image: 'https://drive-thrueats.online/admin/oimg/img_93.jpg', restaurant: 'Burger Arena', category: 'SHAKES', categoryId: 'shakes' },
  // ICE CREAM
  { id: 82, name: 'VANILLA SOFTY SMALL', price: 30, image: 'https://drive-thrueats.online/admin/oimg/img_31.jpg', restaurant: 'Burger Arena', category: 'ICE CREAM / SWEETS', categoryId: 'icecream' },
  { id: 83, name: 'VANILLA SOFTY MEDIUM', price: 40, image: 'https://drive-thrueats.online/admin/oimg/img_32.jpg', restaurant: 'Burger Arena', category: 'ICE CREAM / SWEETS', categoryId: 'icecream' },
  { id: 84, name: 'STRAWBERRY SOFT SMALL', price: 30, image: 'https://drive-thrueats.online/admin/oimg/img_33.jpg', restaurant: 'Burger Arena', category: 'ICE CREAM / SWEETS', categoryId: 'icecream' },
  { id: 85, name: 'STRAWBERRY SOFT MEDIUM', price: 40, image: 'https://drive-thrueats.online/admin/oimg/img_34.jpg', restaurant: 'Burger Arena', category: 'ICE CREAM / SWEETS', categoryId: 'icecream' },
  { id: 86, name: 'BUTTER SCOTCH SOFTY SMALL', price: 30, image: 'https://drive-thrueats.online/admin/oimg/img_35.jpg', restaurant: 'Burger Arena', category: 'ICE CREAM / SWEETS', categoryId: 'icecream' },
  { id: 87, name: 'BUTTER SCOTCH SOFTY MEDIUM', price: 40, image: 'https://drive-thrueats.online/admin/oimg/img_36.jpg', restaurant: 'Burger Arena', category: 'ICE CREAM / SWEETS', categoryId: 'icecream' },
  // WATER
  { id: 88, name: 'SMALL WATER BOTTLE', price: 10, image: 'https://drive-thrueats.online/admin/oimg/img_62.jpg', restaurant: 'Burger Arena', category: 'WATER', categoryId: 'water' },
  { id: 89, name: 'WATER BOTTLE MEDIUM', price: 20, image: 'https://drive-thrueats.online/admin/oimg/img_63.jpg', restaurant: 'Burger Arena', category: 'WATER', categoryId: 'water' },
];
