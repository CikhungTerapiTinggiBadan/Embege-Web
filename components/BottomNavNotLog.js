import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNavNotLog() {
  const pathname = usePathname();
  
  const isActive = (path) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white h-20 flex justify-around items-center px-6 shadow-[0_-4px_20px_rgba(107,127,232,0.1)] z-50 rounded-t-[30px]">
      <Link href="/" className={`flex flex-col items-center ${isActive('/') ? 'text-[#6b7fe8]' : 'text-[#8b90b8]'}`}>
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        </svg>
        {isActive('/') && <div className="w-1 h-1 bg-[#6b7fe8] rounded-full mt-1"></div>}
      </Link>

      <Link href="/scan" className="bg-[#6b7fe8] w-14 h-14 rounded-2xl flex items-center justify-center -mt-10 shadow-lg shadow-[#6b7fe8]/40 border-4 border-[#eef1fb]">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
        </svg>
      </Link>

      <Link href="/login" className={`flex flex-col items-center ${isActive('/profile') ? 'text-[#6b7fe8]' : 'text-[#8b90b8]'}`}>
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7"/>
        </svg>
        {isActive('/profile') && <div className="w-1 h-1 bg-[#6b7fe8] rounded-full mt-1"></div>}
      </Link>
    </nav>
  );
}