# Drive Thru Eats — Next.js Clone

A complete Next.js 14 replica of [drive-thrueats.online](https://drive-thrueats.online/) with full menu, cart, feedback, and responsive design.

## 🛠 Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** (icons)
- React Context API (cart state)

---

## 🚀 Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
drive-thru-eats/
├── app/
│   ├── layout.tsx          # Root layout with Navbar + Footer
│   ├── page.tsx            # Home page (Hero + Menu)
│   ├── globals.css         # Global styles
│   ├── cart/
│   │   └── page.tsx        # Cart page with checkout
│   └── feedback/
│       └── page.tsx        # Customer feedback page
├── components/
│   ├── CartContext.tsx     # Global cart state (React Context)
│   ├── Navbar.tsx          # Top navigation bar
│   ├── Hero.tsx            # Hero / banner section
│   ├── MenuSection.tsx     # Full menu with category scroll
│   ├── CategorySidebar.tsx # Desktop sidebar navigation
│   ├── MenuCard.tsx        # Individual food item card
│   └── Footer.tsx          # Footer with contact info
├── data/
│   └── menu.ts             # All menu items and categories (89 items, 18 categories)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## ✅ Features

- 🏠 **Hero Section** — Coupon banner, search bar, pickup/delivery toggle, APK download link
- 📋 **Full Menu** — 89 items across 18 categories (Breakfast, Shawarma, Pizza, Burger, etc.)
- 🔍 **Category Navigation** — Sticky sidebar (desktop) + horizontal scroll pills (mobile)
- 🛒 **Cart** — Add/remove items, quantity control, coupon code (DISCOUNT10), order type selection
- 📝 **Checkout** — Name, phone, delivery address, order placement
- ⭐ **Feedback Page** — Star rating + message form
- 📱 **Fully Responsive** — Mobile-first design
- 🎨 **Dark Theme** — Matching original site's dark food aesthetic

---

## 🎨 Color Palette

| Variable | Color |
|----------|-------|
| `brand-red` | `#e63946` |
| `brand-orange` | `#f4a261` |
| `brand-dark` | `#1a0a00` |
| `brand-darker` | `#0d0500` |
| `brand-card` | `#1f1008` |
| `brand-border` | `#2e1a0a` |

---

## 🔧 Customization

To add your own menu items, edit `/data/menu.ts`.  
To change colors, update `/tailwind.config.js`.  
To update contact info, edit `/components/Footer.tsx`.

---

## 📞 Original Site Contact

- **Location:** Bismillah City - Hyderabad - Pakistan
- **Email:** alimughal4t@gmail.com
- **Phone:** 3182110366
- **WhatsApp:** +3010036500
