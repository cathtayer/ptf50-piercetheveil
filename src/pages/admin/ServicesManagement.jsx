import { Plus, Power } from 'lucide-react';

export default function ServicesManagement() {
  const services = [
    { id: 1, name: 'Lobe Piercing', duration: '30 mins', price: '₱800', active: true },
    { id: 2, name: 'Helix Piercing', duration: '45 mins', price: '₱1,200', active: true },
    { id: 3, name: 'Industrial', duration: '60 mins', price: '₱2,000', active: false },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="border-b border-brand-blood/30 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif text-brand-cream tracking-wide">Studio Services</h2>
          <p className="text-brand-muted mt-2 font-light tracking-wide text-sm">Configure available piercings, durations, and pricing.</p>
        </div>
        <button className="flex items-center gap-2 border border-brand-cream text-brand-cream px-6 py-2 text-xs uppercase tracking-widest hover:bg-brand-cream hover:text-brand-black transition-all">
          <Plus size={14} /> New Service
        </button>
      </header>

      <div className="space-y-4">
        {services.map((svc) => (
          <div key={svc.id} className={`flex items-center justify-between p-6 border ${svc.active ? 'bg-brand-dark border-brand-blood/20' : 'bg-brand-black border-brand-blood/5'} transition-colors`}>
            <div>
              <h3 className={`font-serif text-xl ${svc.active ? 'text-brand-cream' : 'text-brand-muted'}`}>{svc.name}</h3>
              <p className="text-brand-muted text-xs uppercase tracking-widest mt-1">
                {svc.duration} <span className="text-brand-blood mx-2">|</span> {svc.price}
              </p>
            </div>
            <button className={`flex items-center gap-2 px-4 py-2 border text-xs uppercase tracking-widest transition-all ${
              svc.active 
                ? 'border-brand-blood/50 text-brand-blood hover:bg-brand-blood hover:text-brand-cream' 
                : 'border-brand-muted/30 text-brand-muted hover:border-brand-cream hover:text-brand-cream'
            }`}>
              <Power size={14} />
              {svc.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}