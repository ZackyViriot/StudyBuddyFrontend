'use client';

import { motion } from 'framer-motion';

interface PricingProps {
  onGetStarted: () => void;
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: [
      'Join up to 3 study groups',
      'Access basic study materials',
      'Basic progress tracking',
      'Community forum access',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    description: 'Best for active students',
    features: [
      'Create unlimited study groups',
      'Advanced study materials',
      'Detailed analytics',
      'Priority support',
      'Video conferencing',
      'Ad-free experience',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Premium',
    price: '$19.99',
    period: '/month',
    description: 'For serious achievers',
    features: [
      'Everything in Pro',
      '1-on-1 tutoring sessions',
      'Custom study plans',
      'AI-powered insights',
      'Exclusive workshops',
      'Early access to features',
    ],
    cta: 'Get Premium',
    popular: false,
  },
];

export function Pricing({ onGetStarted }: PricingProps) {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-gray-600 dark:text-gray-300"
          >
            Choose the plan that best fits your needs. All plans include a 14-day free trial.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.div
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`relative h-full rounded-2xl p-8 shadow-lg ${
                  plan.popular
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="inline-flex items-center rounded-full bg-indigo-200 px-4 py-1 text-xs font-medium text-indigo-800 ring-1 ring-inset ring-indigo-600/20">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className={`mt-2 text-sm ${
                    plan.popular ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {plan.description}
                  </p>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    {plan.period && (
                      <span className={`text-sm ${
                        plan.popular ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="mb-8 space-y-4">
                  {plan.features.map((feature) => (
                    <motion.li
                      key={feature}
                      className="flex items-center"
                      initial={false}
                      whileHover={{ x: 5 }}
                    >
                      <svg
                        className={`h-5 w-5 flex-shrink-0 ${
                          plan.popular ? 'text-indigo-200' : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-3 text-sm">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                <motion.button
                  onClick={onGetStarted}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold ${
                    plan.popular
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400'
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Background decoration */}
        <div className="absolute -top-24 -right-48 -z-10">
          <div className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-indigo-500/40 to-purple-500/40 opacity-50 dark:from-indigo-500/20 dark:to-purple-500/20 blur-3xl" />
        </div>
        <div className="absolute -bottom-48 -left-48 -z-10">
          <div className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-purple-500/40 to-indigo-500/40 opacity-50 dark:from-purple-500/20 dark:to-indigo-500/20 blur-3xl" />
        </div>
      </div>
    </section>
  );
} 