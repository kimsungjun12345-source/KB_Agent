'use client';

interface ProgressSidebarProps {
  currentStage: number;
}

const NEXT_PREVIEW: Record<number, string> = {
  1: '다음: 통계 기반 리스크 점수 산출',
  2: '다음: 현재 보장과 필요 보장 비교',
  3: '다음: 고지의무 등 제도 안내',
  4: '다음: 맞춤 상품 추천',
  5: '다음: 보장 내용 상세 질의응답',
  6: '다음: 보험료·보장 조정',
  7: '다음: 최종 설계안 확정',
  8: '다음: KB라이프 가입 절차 안내',
};

const STAGES = [
  { id: 1, title: '기본 정보 수집',   description: '나이, 직업, 가족 구성' },
  { id: 2, title: '리스크 프로파일링', description: '통계 기반 위험도 진단' },
  { id: 3, title: '보장갭 분석',      description: '현재 vs 필요 보장 비교' },
  { id: 4, title: '제도 안내',        description: '고지의무 및 주요 규정' },
  { id: 5, title: '상품 매칭',        description: '맞춤형 상품 추천' },
  { id: 6, title: '상세 상담',        description: '궁금한 점 질의응답' },
  { id: 7, title: '설계 조정',        description: '보험료 및 보장 조정' },
  { id: 8, title: '최종 확인',        description: '설계안 최종 검토' },
  { id: 9, title: '가입 안내',        description: '실제 가입 절차 안내' },
];

export default function ProgressSidebar({ currentStage }: ProgressSidebarProps) {
  const progressPct = Math.round((currentStage / 9) * 100);

  return (
    <div
      className="w-[260px] h-full bg-white border-r border-[#e4e7ed] flex flex-col overflow-hidden"
      style={{ minHeight: 0 }}
    >
      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-[#e4e7ed]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[#374151] uppercase tracking-wide">
            상담 진행
          </span>
          <span className="text-xs font-semibold text-[#D4A900]">
            {currentStage} / 9
          </span>
        </div>
        {/* Progress track */}
        <div className="w-full h-1 bg-[#e4e7ed] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%`, background: '#F5C400' }}
          />
        </div>
        <div className="text-[11px] text-[#9ca3af] mt-1.5">{progressPct}% 완료</div>
      </div>

      {/* Stage list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-0.5">
          {STAGES.map((stage) => {
            const isCompleted = stage.id < currentStage;
            const isCurrent = stage.id === currentStage;
            const isFuture = stage.id > currentStage;

            return (
              <div
                key={stage.id}
                className={`flex items-start space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  isCurrent
                    ? 'bg-[#FFF9DC]'
                    : isCompleted
                    ? 'hover:bg-[#f9fafb]'
                    : 'opacity-50'
                }`}
              >
                {/* Step indicator */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-[#1a3d6b] flex items-center justify-center">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#F5C400' }}>
                      <span className="text-[#1A1A1A] text-[10px] font-bold">{stage.id}</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-[#d1d5db] flex items-center justify-center">
                      <span className="text-[#9ca3af] text-[10px]">{stage.id}</span>
                    </div>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm leading-snug ${
                    isCurrent ? 'font-semibold text-[#111827]' :
                    isCompleted ? 'font-medium text-[#374151]' :
                    'text-[#9ca3af]'
                  }`}>
                    {stage.title}
                  </div>
                  {(isCurrent || isCompleted) && (
                    <div className="text-[11px] text-[#9ca3af] mt-0.5 leading-snug">
                      {stage.description}
                    </div>
                  )}
                  {isCurrent && (
                    <>
                      <div className="flex items-center space-x-1 mt-2">
                        <div className="thinking-dot" />
                        <div className="thinking-dot" />
                        <div className="thinking-dot" />
                        <span className="text-[10px] text-[#9ca3af] ml-1.5">진행 중</span>
                      </div>
                      {NEXT_PREVIEW[stage.id] && (
                        <div className="mt-2 text-[10px] text-[#D4A900] leading-snug">
                          {NEXT_PREVIEW[stage.id]}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#e4e7ed]">
        <div className="text-[11px] text-[#9ca3af] mb-1">전화 상담</div>
        <div className="text-sm font-semibold text-[#1a3d6b]">1588-9922</div>
        <div className="text-[11px] text-[#9ca3af] mt-0.5">평일 09:00–18:00</div>
      </div>
    </div>
  );
}
