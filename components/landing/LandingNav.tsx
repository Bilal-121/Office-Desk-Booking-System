import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export default function LandingNav() {
  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="opacity-90 hover:opacity-100 transition-opacity">
            <Logo size={30} />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-950 transition-colors rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-950 transition-colors rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500">
              How it works
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn btn-ghost hidden sm:inline-flex">
              Sign in
            </Link>
            <Link href="/auth/register" className="btn btn-primary">
              Get started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
