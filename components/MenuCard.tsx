'use client';
import { useState } from 'react';
import { Plus, Check, Star } from 'lucide-react';
import { MenuItem } from '@/data/menu';
import { useCart } from './CartContext';

export default function MenuCard({ item }: { item: MenuItem }) {
  const { addToCart, items } = useCart();
  const [added, setAdded] = useState(false);
  const inCart = items.find(i => i.id === item.id);

  const handleAdd = () => {
    addToCart(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden border border-brand-border hover:border-brand-red/30 transition-all duration-500 shadow-soft hover:shadow-premium hover:-translate-y-2">
      {/* Image Container */}
      <div className="relative overflow-hidden aspect-square bg-brand-bg">
        <img
          src={item.image}
          alt={item.name}
          width={400}
          height={400}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400';
          }}
        />
        
        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {(item as any).discount > 0 && (
            <span className="bg-green-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg border border-white/20">
              {(item as any).discount}% OFF
            </span>
          )}
          {(item as any).tags?.split(',').map((tag: string) => tag.trim() && (
            <span key={tag} className="bg-brand-red text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-lg border border-white/20">
              {tag.trim()}
            </span>
          ))}
          {inCart && (
            <div className="glass px-2 py-1 rounded-lg text-brand-text text-[10px] font-bold animate-bounce-soft">
              In Cart: {inCart.quantity}
            </div>
          )}
        </div>

        {/* Rating Badge */}
        <div className="absolute bottom-3 right-3 glass px-2 py-1 rounded-lg flex items-center gap-1">
          <Star size={10} className="fill-brand-accent text-brand-accent" />
          <span className="text-[10px] font-bold">4.8</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col h-[165px]">
        <div className="mb-1">
          <p className="text-[9px] font-bold text-brand-muted uppercase tracking-[0.2em] mb-0.5">{item.restaurant}</p>
          <h3 className="text-brand-text font-bold text-sm lg:text-[14px] leading-tight group-hover:text-brand-red transition-colors line-clamp-2">
            {item.name}
          </h3>
          {(item as any).description && (
            <p className="text-[9px] text-gray-400 font-medium line-clamp-1 mt-0.5 italic">
              {(item as any).description}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-brand-muted uppercase tracking-wider">Price</span>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-brand-red tracking-tighter">
                ₹{item.price - (item.price * (((item as any).discount || 0) / 100))}
              </span>
              {(item as any).discount > 0 && (
                <span className="text-[9px] text-gray-400 line-through font-bold">₹{item.price}</span>
              )}
            </div>
          </div>

          <button
            onClick={handleAdd}
            className={`relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
              added 
                ? 'bg-green-500 text-white' 
                : 'bg-brand-bg text-brand-text hover:bg-brand-red hover:text-white hover:shadow-lg hover:shadow-brand-red/30'
            }`}
          >
            {added ? (
              <Check size={16} className="animate-fade-in" />
            ) : (
              <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
