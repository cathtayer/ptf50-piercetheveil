import { Search, Mail, Phone } from 'lucide-react';

export default function CustomerManagement() {
  const customers = [
    { id: 1, name: 'Jane Doe', email: 'jane@example.com', phone: '0917 123 4567', visits: 3, lastVisit: 'Nov 04, 2026' },
    { id: 2, name: 'Mark Smith', email: 'mark@example.com', phone: '0918 987 6543', visits: 1, lastVisit: 'Oct 15, 2026' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="border-b border-brand-blood/30 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif text-brand-cream tracking-wide">Client Records</h2>
          <p className="text-brand-muted mt-2 font-light tracking-wide text-sm">View client information and booking history.</p>
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search clients..." 
            className="bg-brand-dark border border-brand-blood/30 pl-10 pr-4 py-2 text-brand-cream text-sm focus:outline-none focus:border-brand-cream w-64"
          />
          <Search size={16} className="absolute left-3 top-2.5 text-brand-muted" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {customers.map((client) => (
          <div key={client.id} className="bg-brand-dark border border-brand-blood/20 p-6 group hover:border-brand-blood/50 transition-colors">
            <h3 className="text-xl font-serif text-brand-cream mb-4">{client.name}</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-brand-muted text-sm font-light">
                <Mail size={14} className="text-brand-blood" />
                {client.email}
              </div>
              <div className="flex items-center gap-3 text-brand-muted text-sm font-light">
                <Phone size={14} className="text-brand-blood" />
                {client.phone}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-blood/20">
              <div>
                <p className="text-[10px] text-brand-muted uppercase tracking-widest mb-1">Total Visits</p>
                <p className="text-brand-cream font-serif text-lg">{client.visits}</p>
              </div>
              <div>
                <p className="text-[10px] text-brand-muted uppercase tracking-widest mb-1">Last Visit</p>
                <p className="text-brand-cream text-sm mt-1.5">{client.lastVisit}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}