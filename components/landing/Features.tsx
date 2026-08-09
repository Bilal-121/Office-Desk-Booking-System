import { motion } from 'framer-motion';
import { Map, Users, LayoutDashboard } from 'lucide-react';

const features = [
  {
    icon: Map,
    title: 'Interactive floor plans',
    description:
      'Every desk on a real map of your office, with live availability. Zoom in, tap a desk, and it is yours.',
  },
  {
    icon: Users,
    title: 'Sit with your team',
    description:
      "See where your teammates have booked before you choose, so standups happen at the desks — not on a call.",
  },
  {
    icon: LayoutDashboard,
    title: 'Admin control',
    description:
      'Manage offices, floors, and desks from one dashboard. Upload a floor plan and position desks in minutes.',
  },
];

export default function Features() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
      <div className="max-w-2xl mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tightest text-gray-950">
          Everything your office needs
        </h2>
        <p className="mt-3 text-lg text-gray-600 leading-relaxed">
          One place to plan where everyone sits — built for hybrid teams.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card card-hover"
            >
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-accent-50 text-accent-700 mb-4">
                <Icon className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-semibold text-gray-950 tracking-tight">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
