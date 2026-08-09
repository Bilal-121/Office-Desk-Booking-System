import { motion } from 'framer-motion';
import AnimatedCounter from '@/components/ui/AnimatedCounter';

// Illustrative marketing copy, not live product metrics.
const stats = [
  { value: 2400, suffix: '+', label: 'Desks bookable' },
  { value: 98, suffix: '%', label: 'Find a desk first try' },
  { value: 30, suffix: 's', label: 'Average booking time' },
];

export default function StatsBand() {
  return (
    <section className="border-y border-gray-200/60 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center sm:text-left"
            >
              <div className="w-8 h-1 rounded-full bg-accent-500 mb-4 mx-auto sm:mx-0" />
              <p className="text-4xl md:text-5xl font-extrabold tracking-tightest text-gray-950">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
