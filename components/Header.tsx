'use client';

interface HeaderProps {
  currentStep: number;
  monthlyPremium: number;
  coverageRate: number;
  riskScore: number;
}

const steps = [
  { id: 1, name: '정보 입력' },
  { id: 2, name: '리스크 진단' },
  { id: 3, name: '보장 분석' },
  { id: 4, name: '상품 추천' },
  { id: 5, name: '설계 확정' },
];

export default function Header({
  currentStep = 1,
  monthlyPremium = 0,
  coverageRate = 0,
  riskScore = 0
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e4e7ed] h-14">
      <div className="flex items-center justify-between h-full px-6 max-w-screen-2xl mx-auto">

        {/* Logo */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          <div className="w-7 h-7 bg-[#1a3d6b] rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs tracking-tight">KB</span>
          </div>
          <span className="text-sm font-semibold text-[#111827]">보험 설계</span>
        </div>

        {/* Step progress */}
        <div className="hidden md:flex items-center space-x-0">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center space-x-2 px-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                  currentStep > step.id
                    ? 'bg-[#1a3d6b] text-white'
                    : currentStep === step.id
                    ? 'bg-[#1a3d6b] text-white'
                    : 'bg-[#f1f3f7] text-[#9ca3af]'
                }`}>
                  {currentStep > step.id ? (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : step.id}
                </div>
                <span className={`text-xs whitespace-nowrap transition-colors ${
                  currentStep >= step.id ? 'text-[#374151] font-medium' : 'text-[#9ca3af]'
                }`}>
                  {step.name}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-6 h-px transition-colors ${
                  currentStep > step.id ? 'bg-[#1a3d6b]' : 'bg-[#e4e7ed]'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Key metrics */}
        <div className="flex items-center space-x-5">
          {[
            { label: '월 보험료', value: monthlyPremium > 0 ? `${monthlyPremium.toLocaleString()}원` : '—' },
            { label: '커버율',   value: coverageRate   > 0 ? `${coverageRate}%` : '—' },
            { label: '리스크',   value: riskScore       > 0 ? `${riskScore}점` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="text-right hidden lg:block">
              <div className="text-[10px] text-[#9ca3af] uppercase tracking-wide">{label}</div>
              <div className="text-sm font-semibold text-[#111827] mt-0.5">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
