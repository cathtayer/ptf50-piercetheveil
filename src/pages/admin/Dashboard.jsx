import { Check, X } from 'lucide-react';

export default function Dashboard() {
  const pendingRequests = [
    { id: '1', customer: 'Jane Doe', service: 'Helix Piercing', date: 'Nov 04, 2026', time: '14:00', status: 'PENDING' },
    { id: '2', customer: 'Mark Smith', service: 'Lobe Piercing', date: 'Nov 05, 2026', time: '10:30', status: 'PENDING' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="border-b border-brand-blood/30 pb-6">
        <h2 className="text-4xl font-serif text-brand-cream tracking-wide">Ritual Overview</h2>
        <p className="text-brand-muted mt-2 font-light tracking-wide text-sm">Manage today's schedule and pending appointment requests.</p>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-dark p-6 border border-brand-blood/20 relative group hover:border-brand-blood/50 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-blood"></div>
          <h3 className="text-brand-muted text-xs uppercase tracking-widest mb-2">Pending Requests</h3>
          <p className="text-5xl font-serif text-brand-cream">{pendingRequests.length}</p>
        </div>
        <div className="bg-brand-dark p-6 border border-brand-blood/20">
          <h3 className="text-brand-muted text-xs uppercase tracking-widest mb-2">Today's Bookings</h3>
          <p className="text-5xl font-serif text-brand-cream">4</p>
        </div>
        <div className="bg-brand-dark p-6 border border-brand-blood/20">
          <h3 className="text-brand-muted text-xs uppercase tracking-widest mb-2">Completed This Week</h3>
          <p className="text-5xl font-serif text-brand-cream">12</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-brand-dark border border-brand-blood/20">
        <div className="p-6 border-b border-brand-blood/20">
          <h3 className="text-xl font-serif text-brand-cream tracking-wide">Pending Approvals</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-brand-muted text-[10px] uppercase tracking-[0.2em] border-b border-brand-blood/20 bg-brand-black/50">
                <th className="p-6 font-light">Client</th>
                <th className="p-6 font-light">Service</th>
                <th className="p-6 font-light">Date & Time</th>
                <th className="p-6 font-light text-center">Verdict</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light">
              {pendingRequests.map((req) => (
                <tr key={req.id} className="border-b border-brand-blood/10 hover:bg-brand-black/30 transition-colors">
                  <td className="p-6 text-brand-cream tracking-wide">{req.customer}</td>
                  <td className="p-6 text-brand-muted">{req.service}</td>
                  <td className="p-6 text-brand-muted">{req.date} <span className="text-brand-blood mx-2">|</span> {req.time}</td>
                  <td className="p-6 flex justify-center gap-4">
                    <button className="text-brand-cream hover:text-[#4ade80] transition-colors flex items-center gap-2 text-xs uppercase tracking-widest">
                      <Check size={14} /> Approve
                    </button>
                    <button className="text-brand-cream hover:text-brand-blood transition-colors flex items-center gap-2 text-xs uppercase tracking-widest">
                      <X size={14} /> Reject
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