import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { motion } from 'framer-motion';
import { authOptions } from '@/lib/auth';
import LandingNav from '@/components/landing/LandingNav';
import Hero from '@/components/landing/Hero';
import StatsBand from '@/components/landing/StatsBand';
import Features from '@/components/landing/Features';
import LandingFooter from '@/components/landing/LandingFooter';

const steps = [
  {
    number: '01',
    title: 'Pick a date and time',
    description: 'Choose when you are coming in — a single day or a whole week at once.',
  },
  {
    number: '02',
    title: 'Tap a desk on the floor plan',
    description: 'Green means free. See who is sitting nearby and where your team has booked.',
  },
  {
    number: '03',
    title: 'Done — see you at the office',
    description: 'Your booking is confirmed instantly and waiting in My Bookings.',
  },
];

export default function Landing() {
  return (
    <>
      <Head>
        <title>Deskivo — Book your perfect desk in seconds</title>
        <meta
          name="description"
          content="See your office on a live floor plan, find your teammates, and reserve the right desk in seconds."
        />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <LandingNav />
        <main>
          <Hero />
          <StatsBand />
          <Features />

          {/* How it works */}
          <section id="how-it-works" className="bg-white border-t border-gray-200/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
              <div className="max-w-2xl mb-12">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tightest text-gray-950">
                  How it works
                </h2>
                <p className="mt-3 text-lg text-gray-600 leading-relaxed">
                  Three steps between you and your favorite desk.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-accent-50 text-accent-700 text-sm font-bold tracking-tight mb-4">
                      {step.number}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-950 tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </main>
        <LandingFooter />
      </div>
    </>
  );
}

// Logged-in users go straight to the app; logged-out visitors get the
// server-rendered landing with no auth flash.
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (session) {
    return { redirect: { destination: '/desks', permanent: false } };
  }
  return { props: {} };
};
