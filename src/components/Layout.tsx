import React from 'react';
import { Search, Plus } from 'lucide-react';
import { useBoard } from '../context/BoardContext';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { searchQuery, setSearchQuery, openTaskModal } = useBoard();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-[#d2d2d2] font-mono">
      {/* Top Bar */}
      <header className="h-16 border-b border-[#2e2e2e] flex items-center justify-between px-6 shrink-0 bg-[#1e1e1e]" style={{ WebkitAppRegion: 'drag' } as any}>
        <h1 className="text-2xl font-bold tracking-wider font-sans select-none text-[#d2d2d2]">HERA</h1>
        
        <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#818181]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#2e2e2e] border border-[#818181]/30 rounded-md py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:border-[#818181] transition-colors w-64 text-[#d2d2d2]"
            />
          </div>
          
          <button onClick={() => openTaskModal()} className="bg-[#2e2e2e] hover:bg-[#818181]/30 border border-[#818181]/30 rounded-md p-1.5 transition-colors group">
            <Plus className="w-5 h-5 text-[#818181] group-hover:text-[#d2d2d2]" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {children}
      </main>
    </div>
  );
};
