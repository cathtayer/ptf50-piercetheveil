import { Gem } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/admin'); // Simulates login routing for frontend flow
  };

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-dark border border-brand-blood/30 p-10 shadow-2xl relative">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-brand-cream"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-brand-cream"></div>
        
        <div className="text-center mb-10">
          <Gem size={32} strokeWidth={1} className="text-brand-blood mx-auto mb-4" />
          <h1 className="text-4xl font-serif text-brand-cream tracking-widest mb-2">Pierce <span className="italic text-brand-blood">the</span> Veil</h1>
          <p className="text-xs text-brand-muted uppercase tracking-[0.2em]">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-8">
          <div>
            <label className="block text-xs text-brand-muted uppercase tracking-widest mb-2">Username</label>
            <input 
              type="text" 
              className="w-full bg-transparent border-b border-brand-blood/50 pb-2 text-brand-cream focus:outline-none focus:border-brand-cream transition-colors font-light"
              placeholder="Enter your username"
            />
          </div>
          
          <div>
            <label className="block text-xs text-brand-muted uppercase tracking-widest mb-2">Passcode</label>
            <input 
              type="password" 
              className="w-full bg-transparent border-b border-brand-blood/50 pb-2 text-brand-cream focus:outline-none focus:border-brand-cream transition-colors font-light"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full border border-brand-cream text-brand-cream py-3 uppercase tracking-[0.2em] text-xs hover:bg-brand-cream hover:text-brand-black transition-all duration-300 mt-4"
          >
            Enter Portal
          </button>
        </form>
      </div>
    </div>
  );
}