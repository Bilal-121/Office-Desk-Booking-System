import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 18 },
  },
};

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background grid, faded toward the bottom */}
      <div className="absolute inset-0 bg-grid mask-fade-b" aria-hidden="true" />

      {/* Floating decorative shapes */}
      <motion.div
        aria-hidden="true"
        className="hidden lg:block absolute top-20 right-[6%] w-72 h-72 rounded-full bg-accent-100 blur-3xl opacity-70"
        animate={{ y: [0, -24, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="hidden lg:block absolute top-1/3 right-[16%] w-40 h-40 rounded-full border-2 border-accent-300/60"
        animate={{ y: [0, 18, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden="true"
        className="hidden lg:block absolute bottom-16 left-[8%] w-16 h-16 rounded-2xl border border-accent-400/40"
        animate={{ rotate: [12, 48, 12] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={item} className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-accent-50 ring-1 ring-inset ring-accent-600/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-950">
                Desk booking, reimagined
              </span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={item}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tightest text-gray-950 leading-[1.05]"
          >
            Book your perfect desk in <span className="text-accent-600">seconds</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            See your office on a live floor plan, find where your teammates are sitting,
            and reserve the right desk before you even leave home.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={item}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link href="/auth/register" className="btn btn-accent btn-lg">
              Get started free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/auth/login" className="btn btn-secondary btn-lg">
              Sign in
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
