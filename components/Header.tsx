'use client';

interface HeaderProps {
  currentStep: number;
  monthlyPremium: number;
  coverageRate: number;
  riskScore: number;
}

const steps = [
  { id: 1, name: '정보입력', key: 'info' },
  { id: 2, name: '리스크', key: 'risk' },
  { id: 3, name: '보장', key: 'coverage' },
  { id: 4, name: '상품', key: 'product' },
  { id: 5, name: '설계', key: 'design' }
];

export default function Header({
  currentStep = 1,
  monthlyPremium = 0,
  coverageRate = 0,
  riskScore = 0
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 h-16">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">KB</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg">보험 설계</span>
        </div>

        {/* Progress Steps */}
        <div className="hidden md:flex items-center space-x-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
                  ${currentStep >= step.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                  }
                `}>
                  {step.id}
                </div>
                <span className={`
                  text-sm font-medium
                  ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'}
                `}>
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-8 h-px mx-4
                  ${currentStep > step.id ? 'bg-blue-500' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <div className="text-xs text-gray-500">월 보험료</div>
            <div className="text-sm font-semibold text-gray-900">
              {monthlyPremium > 0 ? `${monthlyPremium.toLocaleString()}원` : '-'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">보장 커버율</div>
            <div className="text-sm font-semibold text-gray-900">
              {coverageRate > 0 ? `${coverageRate}%` : '-'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">리스크 점수</div>
            <div className="text-sm font-semibold text-gray-900">
              {riskScore > 0 ? `${riskScore}점` : '-'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}