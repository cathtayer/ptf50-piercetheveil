import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function JewelryManagement() {
  const catalog = [
    { id: 1, name: 'Titanium Clicker', style: 'Minimalist', price: '₱1,200', stock: 15 },
    { id: 2, name: 'Gold Filigree Stud', style: 'Vintage', price: '₱3,500', stock: 4 },
    { id: 3, name: 'Opal Teardrop', style: 'Statement', price: '₱2,800', stock: 0 },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="border-b border-brand-blood/30 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif text-brand-cream tracking-wide">Jewelry Collection</h2>
          <p className="text-brand-muted mt-2 font-light tracking-wide text-sm">Manage inventory and AI-recommendation attributes.</p>
        </div>
        <button className="flex items-center gap-2 border border-brand-cream text-brand-cream px-6 py-2 text-xs uppercase tracking-widest hover:bg-brand-cream hover:text-brand-black transition-all">
          <Plus size={14} /> Add Piece
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {catalog.map((item) => (
          <div key={item.id} className="bg-brand-dark border border-brand-blood/20 p-6 group hover:border-brand-blood/50 transition-all">
            <div className="h-40 bg-brand-black border border-brand-blood/10 mb-4 flex items-center justify-center">
              <span className="text-brand-muted text-xs uppercase tracking-widest">Image Placeholder</span>
            </div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-brand-cream font-serif text-lg">{item.name}</h3>
              <span className="text-brand-gold text-sm tracking-widest">{item.price}</span>
            </div>
            <p className="text-brand-muted text-xs uppercase tracking-widest mb-6">Style: {item.style}</p>
            
            <div className="flex justify-between items-center pt-4 border-t border-brand-blood/20">
              <span className={`text-xs uppercase tracking-widest ${item.stock > 0 ? 'text-[#4ade80]' : 'text-brand-blood'}`}>
                {item.stock > 0 ? `${item.stock} In Stock` : 'Out of Stock'}
              </span>
              <div className="flex gap-3">
                <button className="text-brand-muted hover:text-brand-cream transition-colors"><Edit2 size={14} /></button>
                <button className="text-brand-muted hover:text-brand-blood transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}