import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { LogOut, Search, Calendar, LayoutDashboard } from 'lucide-react';
import { ReactNode } from 'react';
import Spinner from '@/components/ui/Spinner';
import Logo from '@/components/ui/Logo';
import { getInitials } from '@/lib/initials';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return <>{children}</>;
  }

  const navigation = [
    { name: 'Find a Desk', href: '/desks', icon: Search },
    { name: 'My Bookings', href: '/bookings', icon: Calendar },
  ];

  if ((session.user as any).role === 'ADMIN') {
    navigation.push({ name: 'Admin', href: '/admin', icon: LayoutDashboard });
  }

  const initials = getInitials(session.user?.name);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link
                href="/desks"
                className="flex-shrink-0 flex items-center opacity-90 hover:opacity-100 transition-opacity"
              >
                <Logo size={30} />
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:gap-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = router.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-gray-100 text-gray-950 font-semibold'
                          : 'text-gray-600 font-medium hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-accent-600' : ''}`} />
                      {item.name}
                      {isActive && (
                        <span className="absolute -bottom-3 left-3 right-3 h-0.5 rounded-full bg-accent-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-full bg-gray-950 text-white flex items-center justify-center text-xs font-semibold">
                  {initials}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent-400 ring-2 ring-white" />
                </div>
                <div className="text-sm leading-tight">
                  <p className="font-medium text-gray-900">{session.user?.name}</p>
                  <p className="text-xs text-gray-500">{(session.user as any)?.role}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="btn btn-ghost btn-sm ring-1 ring-inset ring-gray-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
          <div className="sm:hidden pb-3 flex items-center gap-2 overflow-x-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href;
              return (
                <Link
                  key={`mobile-${item.name}`}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-950 font-semibold'
                      : 'text-gray-600 font-medium hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-accent-600' : ''}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
