import { Shield, Lock, Award, Clock } from 'lucide-react';

export function TrustBadges() {
  const badges = [
    {
      icon: Shield,
      title: 'Secure Booking',
      description: 'Your payment information is encrypted and secure',
    },
    {
      icon: Lock,
      title: 'Best Price Guarantee',
      description: 'Find a lower price? We\'ll match it',
    },
    {
      icon: Award,
      title: 'Verified Hotels',
      description: 'All hotels are verified and reviewed',
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Our team is here to help anytime',
    },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white py-16 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div
                key={index}
                className="text-center group animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-accent shadow-medium group-hover:shadow-strong transition-all duration-300 group-hover:scale-110 mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 font-display">{badge.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

