'use client';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'navy' | 'red';
}

const trendConfig = {
  up:      { symbol: '↑', className: 'text-[#059669]' },
  down:    { symbol: '↓', className: 'text-[#dc2626]' },
  neutral: { symbol: '→', className: 'text-[#9ca3af]' },
};

const colorConfig = {
  navy:  { dot: 'bg-[#1a3d6b]',  accent: 'text-[#1a3d6b]' },
  blue:  { dot: 'bg-[#2563eb]',  accent: 'text-[#2563eb]' },
  green: { dot: 'bg-[#059669]',  accent: 'text-[#059669]' },
  red:   { dot: 'bg-[#dc2626]',  accent: 'text-[#dc2626]' },
};

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  color = 'navy'
}: MetricCardProps) {
  const { dot, accent } = colorConfig[color] ?? colorConfig.navy;
  const tc = trend ? trendConfig[trend] : null;

  return (
    <div className="bg-white border border-[#e4e7ed] rounded-xl p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200">
      {/* Label row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">{title}</span>
        </div>
        {tc && (
          <span className={`text-xs font-semibold ${tc.className}`}>
            {tc.symbol}
          </span>
        )}
      </div>

      {/* Value */}
      <div className={`text-2xl font-bold tracking-tight leading-none mb-1.5 ${accent}`}>
        {typeof value === 'number' && value > 0 ? value.toLocaleString() : value || '—'}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-xs text-[#9ca3af]">{subtitle}</div>
      )}
    </div>
  );
}
