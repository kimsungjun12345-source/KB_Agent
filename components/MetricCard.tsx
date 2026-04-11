'use client';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red';
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue'
}: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50'
  };

  const trendIcons = {
    up: '↗',
    down: '↘',
    neutral: '→'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          {icon && (
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
              {icon}
            </div>
          )}
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        {trend && (
          <span className={`text-sm ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400'}`}>
            {trendIcons[trend]}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="text-3xl font-bold text-gray-900">
          {typeof value === 'number' && value > 0 ? value.toLocaleString() : value || '-'}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-500">{subtitle}</div>
        )}
      </div>
    </div>
  );
}