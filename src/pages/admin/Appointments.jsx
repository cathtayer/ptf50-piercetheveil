import { Filter, MoreVertical, Calendar } from 'lucide-react';

export default function Appointments() {
  const appointments = [
    { id: '1', client: 'Jane Doe', service: 'Helix Piercing', date: 'Nov 04, 2026', status: 'Approved' },
    { id: '2', client: 'Mark Smith', service: 'Lobe Piercing', date: 'Nov 05, 2026', status: 'Pending' },
    { id: '3', client: 'Alice Glass', service: 'Septum', date: 'Nov 01, 2026', status: 'Completed' },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10';
      case 'Pending': return 'text-brand-gold border-brand-gold/30 bg-brand-gold/10';
      case 'Completed': return 'text-brand-muted border-brand-muted/30 bg-brand-muted/10';
      default: return 'text-brand-cream border-brand-cream/30 bg-transparent';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="border-b border-brand-blood/30 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-serif text-brand-cream tracking-wide">Appointments Ledger</h2>
          <p className="text-brand-muted mt-2 font-light tracking-wide text-sm">Review and manage the complete booking history.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 border border-brand-blood/50 text-brand-cream px-4 py-2 text-xs uppercase tracking-widest hover:bg-brand-blood/10 transition-all">
            <Filter size={14} /> Filter
          </button>
          <button className="flex items-center gap-2 border border-brand-cream text-brand-cream px-6 py-2 text-xs uppercase tracking-widest hover:bg-brand-cream hover:text-brand-black transition-all">
            <Calendar size={14} /> New Booking
          </button>
        </div>
      </header>

      <div className="bg-brand-dark border border-brand-blood/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-brand-muted text-[10px] uppercase tracking-[0.2em] border-b border-brand-blood/20 bg-brand-black/50">
                <th className="p-6 font-light">Client</th>
                <th className="p-6 font-light">Service</th>
                <th className="p-6 font-light">Date</th>
                <th className="p-6 font-light">Status</th>
                <th className="p-6 font-light text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light">
              {appointments.map((apt) => (
                <tr key={apt.id} className="border-b border-brand-blood/10 hover:bg-brand-black/30 transition-colors">
                  <td className="p-6 text-brand-cream tracking-wide">{apt.client}</td>
                  <td className="p-6 text-brand-muted">{apt.service}</td>
                  <td className="p-6 text-brand-muted">{apt.date}</td>
                  <td className="p-6">
                    <span className={`px-3 py-1 text-[10px] uppercase tracking-widest border ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button className="text-brand-muted hover:text-brand-cream transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}