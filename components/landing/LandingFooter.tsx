import Link from 'next/link';
import LogoMark from '@/components/ui/LogoMark';

export default function LandingFooter() {
  return (
    <footer className="border-t border-gray-200/60 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <div>
              <p className="text-base font-bold uppercase tracking-tight text-gray-950 leading-none">
                DESKI<span className="text-accent-500">V</span>O
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Your office, one tap away.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-950 transition-colors rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="text-accent-700 hover:text-accent-600 transition-colors rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              Create account
            </Link>
          </div>
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} Deskivo</p>
        </div>
      </div>
    </footer>
  );
}
