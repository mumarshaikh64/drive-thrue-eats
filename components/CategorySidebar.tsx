'use client';
import { categories } from '@/data/menu';

interface CategorySidebarProps {
  activeCategory: string;
  onSelect: (id: string) => void;
}

export default function CategorySidebar({ activeCategory, onSelect }: CategorySidebarProps) {
  return (
    <aside className="w-64 shrink-0 hidden lg:block sticky top-24 self-start">
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-brand-red px-5 py-4">
          <p className="text-white font-bold text-sm uppercase tracking-widest text-center">Menu Category</p>
        </div>
        <nav className="py-3 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide px-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`w-full text-left px-4 py-3 mb-1 rounded-xl flex items-center text-sm font-bold transition-all ${
                activeCategory === cat.id
                  ? 'bg-brand-red/10 text-brand-red'
                  : 'text-brand-muted hover:text-brand-text hover:bg-brand-bg'
              }`}
            >
              <span className="leading-tight">{cat.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
}
