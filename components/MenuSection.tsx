'use client';
import { useState, useEffect, useRef } from 'react';
import MenuCard from './MenuCard';
import { Search, SlidersHorizontal, ArrowRight } from 'lucide-react';

export default function MenuSection() {
  const [categories, setCategories] = useState<any[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
          const allItems = data.flatMap(cat => cat.items || []);
          setAllMenuItems(allItems);
          if (data.length > 0) setActiveCategory(data[0].id);
        }
        setLoading(false);
      });
  }, []);

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    const el = sectionRefs.current[id];
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (searchQuery || categories.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );
    categories.forEach(cat => {
      const el = document.getElementById(cat.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [searchQuery, categories]);

  const isSearchActive = searchQuery.trim().length > 0;
  
  const getFilteredItems = (categoryId?: string) => {
    let items = categoryId 
      ? allMenuItems.filter(i => i.categoryId === categoryId)
      : allMenuItems;
      
    if (isSearchActive) {
      const lowerQuery = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) || 
        (item.restaurant && item.restaurant.toLowerCase().includes(lowerQuery))
      );
    }
    return items;
  };

  if (loading) return <div className="py-20 text-center font-bold animate-pulse text-brand-muted tracking-[0.5em]">PREPARING FRESH MENU...</div>;

  return (
    <section id="menu" className="bg-brand-bg section-padding relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-red/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col mb-16 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-6xl font-bold text-brand-text tracking-tighter">
                Explore Our <br />
                <span className="text-brand-red">Legendary Menu</span>
              </h2>
              <p className="text-brand-muted font-medium max-w-md">
                From morning breakfast to late night snacks, we&apos;ve got your cravings covered.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group flex-1 md:w-80">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-red transition-colors" />
                <input
                  type="text"
                  placeholder="Search flavors..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-14 bg-white border border-brand-border rounded-2xl pl-12 pr-6 text-brand-text placeholder-brand-muted focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red transition-all shadow-soft"
                />
              </div>
              <button className="w-14 h-14 rounded-2xl bg-white border border-brand-border flex items-center justify-center text-brand-text hover:bg-brand-bg transition-colors shadow-soft">
                <SlidersHorizontal size={20} />
              </button>
            </div>
          </div>

          {!isSearchActive && (
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex gap-3 pb-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                      activeCategory === cat.id
                        ? 'bg-brand-text text-white shadow-premium scale-105'
                        : 'bg-white border border-brand-border text-brand-muted hover:text-brand-text hover:border-brand-text'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-12 relative items-start">
          <div className="flex-1 space-y-24">
            {isSearchActive && (
              <div className="animate-fade-in">
                {getFilteredItems().length === 0 ? (
                  <div className="text-center py-24 bg-white rounded-4xl border-2 border-dashed border-brand-border">
                    <div className="text-8xl mb-6">🤌</div>
                    <h3 className="text-2xl font-bold text-brand-text mb-2">Non found, Chef!</h3>
                    <p className="text-brand-muted mb-8">Maybe try searching for &apos;Burger&apos; or &apos;Pizza&apos;?</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="btn-secondary"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-4 mb-10">
                      <div className="h-12 w-12 rounded-2xl bg-brand-red/10 flex items-center justify-center text-brand-red">
                        <Search size={24} />
                      </div>
                      <h2 className="text-brand-text font-bold text-3xl tracking-tight">
                        Results for &quot;{searchQuery}&quot;
                        <span className="ml-3 text-sm font-bold text-brand-muted bg-brand-bg px-3 py-1 rounded-full border border-brand-border uppercase tracking-widest">{getFilteredItems().length} Items</span>
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-7">
                      {getFilteredItems().map(item => (
                        <MenuCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isSearchActive && categories.map(cat => {
              const items = getFilteredItems(cat.id);
              if (items.length === 0) return null;
              
              return (
                <div
                  key={cat.id}
                  id={cat.id}
                  ref={el => { sectionRefs.current[cat.id] = el; }}
                  className="scroll-mt-[150px] animate-fade-in"
                >
                  <div className="flex items-center justify-between gap-6 mb-10 group">
                    <div className="flex items-center gap-5">
                      <div className="w-1.5 h-14 rounded-full bg-brand-red/70" />
                      <div>
                        <h2 className="text-brand-text font-bold text-3xl lg:text-4xl tracking-tight">{cat.name}</h2>
                        <p className="text-brand-muted text-sm font-bold uppercase tracking-[0.2em]">{items.length} Options Available</p>
                      </div>
                    </div>
                    <div className="hidden md:flex flex-1 h-px bg-brand-border" />
                    <button className="hidden md:flex items-center gap-2 text-brand-red font-bold text-sm uppercase tracking-widest hover:translate-x-2 transition-transform">
                      View All <ArrowRight size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-7">
                    {items.map(item => (
                      <MenuCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
