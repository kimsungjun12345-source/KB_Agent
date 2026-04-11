'use client';

interface ProgressSidebarProps {
  currentStage: number;
}

const STAGES = [
  { id: 1, title: '기본 정보 수집', icon: '📝', description: '나이, 직업, 가족 구성 등' },
  { id: 2, title: '리스크 프로파일링', icon: '📊', description: '통계 기반 위험도 진단' },
  { id: 3, title: '보장갭 분석', icon: '🔍', description: '현재 vs 필요 보장 비교' },
  { id: 4, title: '제도 안내', icon: '📋', description: '고지의무 및 주요 규정' },
  { id: 5, title: '상품 매칭', icon: '🎯', description: '맞춤형 상품 추천' },
  { id: 6, title: '상세 상담', icon: '💬', description: '궁금한 점 질의응답' },
  { id: 7, title: '설계 조정', icon: '⚙️', description: '보험료 및 보장 조정' },
  { id: 8, title: '최종 확인', icon: '✅', description: '설계안 최종 검토' },
  { id: 9, title: '가입 안내', icon: '🤝', description: '실제 가입 절차 안내' }
];

export default function ProgressSidebar({ currentStage }: ProgressSidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">상담 진행 상황</h2>
        <div className="text-sm text-gray-600">
          {currentStage}/9단계 진행 중
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStage / 9) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {STAGES.map((stage) => {
          const isCompleted = stage.id < currentStage;
          const isCurrent = stage.id === currentStage;

          return (
            <div
              key={stage.id}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                isCurrent
                  ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-100'
                  : isCompleted
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isCurrent
                      ? 'bg-orange-500 text-white'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? '✓' : stage.id}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{stage.icon}</span>
                    <h3
                      className={`font-medium text-sm ${
                        isCurrent
                          ? 'text-orange-900'
                          : isCompleted
                          ? 'text-green-900'
                          : 'text-gray-500'
                      }`}
                    >
                      {stage.title}
                    </h3>
                  </div>
                  <p
                    className={`text-xs ${
                      isCurrent
                        ? 'text-orange-600'
                        : isCompleted
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {stage.description}
                  </p>
                  {isCurrent && (
                    <div className="mt-2 flex items-center space-x-1">
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      <span className="text-xs text-orange-600 ml-2">진행 중...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2 text-sm">💡 상담 안내</h3>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 정확한 진단을 위해 솔직하게 답변해 주세요</li>
          <li>• 언제든지 질문하시면 자세히 설명드립니다</li>
          <li>• 상담 중 저장되지 않으니 한 번에 완료해 주세요</li>
        </ul>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-600 text-center">
          <div className="font-medium">전화 상담 문의</div>
          <div className="text-orange-600 font-bold">1588-9922</div>
          <div className="mt-1">평일 09:00~18:00</div>
        </div>
      </div>
    </div>
  );
}