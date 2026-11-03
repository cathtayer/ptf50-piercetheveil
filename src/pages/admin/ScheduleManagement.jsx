import { Clock, CalendarX } from 'lucide-react';

export default function ScheduleManagement() {
  const hours = [
    { day: 'Monday', open: 'Closed', close: 'Closed' },
    { day: 'Tuesday', open: '10:00 AM', close: '7:00 PM' },
    { day: 'Wednesday', open: '10:00 AM', close: '7:00 PM' },
    { day: 'Thursday', open: '10:00 AM', close: '7:00 PM' },
    { day: 'Friday', open: '10:00 AM', close: '8:00 PM' },
    { day: 'Saturday', open: '10:00 AM', close: '8:00 PM' },
    { day: 'Sunday', open: '11:00 AM', close: '5:00 PM' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <header className="border-b border-brand-blood/30 pb-6">
        <h2 className="text-4xl font-serif text-brand-cream tracking-wide">Schedule & Availability</h2>
        <p className="text-brand-muted mt-2 font-light tracking-wide text-sm">Set operating hours and block specific dates.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Operating Hours */}
        <div className="bg-brand-dark border border-brand-blood/20 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="text-brand-blood" size={20} />
            <h3 className="text-xl font-serif text-brand-cream tracking-wide">Operating Hours</h3>
          </div>
          <div className="space-y-4">
            {hours.map((h) => (
              <div key={h.day} className="flex justify-between items-center border-b border-brand-blood/10 pb-4">
                <span className="text-brand-cream font-light tracking-wider">{h.day}</span>
                <span className={`text-sm tracking-widest uppercase ${h.open === 'Closed' ? 'text-brand-blood' : 'text-brand-muted'}`}>
                  {h.open === 'Closed' ? 'Closed' : `${h.open} - ${h.close}`}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 border border-brand-cream text-brand-cream py-3 text-xs uppercase tracking-widest hover:bg-brand-cream hover:text-brand-black transition-all">
            Update Hours
          </button>
        </div>

        {/* Blocked Dates */}
        <div className="bg-brand-dark border border-brand-blood/20 p-8 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <CalendarX className="text-brand-blood" size={20} />
            <h3 className="text-xl font-serif text-brand-cream tracking-wide">Blocked Dates</h3>
          </div>
          <p className="text-brand-muted text-sm font-light mb-6">Add dates when the studio will be closed for holidays or events.</p>
          
          <div className="flex gap-4 mb-8">
            <input 
              type="date" 
              className="flex-1 bg-brand-black border border-brand-blood/30 p-3 text-brand-cream text-sm focus:outline-none focus:border-brand-cream color-scheme-dark"
            />
            <button className="border border-brand-blood text-brand-blood px-6 py-3 text-xs uppercase tracking-widest hover:bg-brand-blood hover:text-brand-cream transition-all">
              Block
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center p-4 bg-brand-black border border-brand-blood/10">
              <span className="text-brand-cream text-sm tracking-wider">Dec 25, 2026</span>
              <span className="text-brand-muted text-xs uppercase tracking-widest">Christmas Day</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-brand-black border border-brand-blood/10">
              <span className="text-brand-cream text-sm tracking-wider">Jan 01, 2027</span>
              <span className="text-brand-muted text-xs uppercase tracking-widest">New Year</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}