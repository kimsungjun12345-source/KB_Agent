'use client';

import { useState } from 'react';

interface WelcomeScreenProps {
  onStart: (name: string) => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [name, setName] = useState('');
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && agreedToPrivacy) {
      onStart(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* KB라이프 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">KB</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">KB라이프</h1>
              <p className="text-lg text-orange-600 font-medium">디지털 보험상담실</p>
            </div>
          </div>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              맞춤형 보험 진단을 시작해보세요
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              통계청 데이터 기반 객관적 리스크 분석으로<br />
              <span className="text-orange-600 font-medium">과학적이고 신뢰할 수 있는</span> 보험 설계를 경험하세요
            </p>
          </div>

          {/* 특징 소개 */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">통계 기반 진단</h3>
              <p className="text-sm text-gray-600">통계청 실제 데이터로 객관적 리스크 분석</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">보장갭 분석</h3>
              <p className="text-sm text-gray-600">현재 보험 vs 필요 보장 정밀 비교</p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">맞춤 설계</h3>
              <p className="text-sm text-gray-600">개인 상황에 최적화된 상품 추천</p>
            </div>
          </div>

          {/* 이름 입력 폼 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                상담을 시작하기 위해 성함을 알려주세요
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예) 홍길동"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            {/* 개인정보 동의 */}
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-3">개인정보 수집·이용 동의</h3>
                <div className="text-sm text-gray-600 space-y-2 max-h-32 overflow-y-auto">
                  <p><strong>수집목적:</strong> 보험 상담 및 맞춤형 상품 추천</p>
                  <p><strong>수집항목:</strong> 이름, 나이, 성별, 직업, 가족구성, 건강정보, 기존보험현황</p>
                  <p><strong>보유기간:</strong> 상담 완료 후 즉시 삭제 (세션 종료 시)</p>
                  <p><strong>거부권리:</strong> 동의를 거부할 수 있으나, 이 경우 상담 서비스 이용이 제한됩니다.</p>
                </div>
                <div className="mt-3 flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="privacy-agreement"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="privacy-agreement" className="text-sm text-gray-700">
                    개인정보 수집·이용에 동의합니다. <span className="text-red-500">*</span>
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !agreedToPrivacy}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              개인정보 동의 및 보험 진단 시작하기
            </button>
          </form>

          {/* 하단 안내 */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>📞 상담 문의: 1588-9922</span>
              <span>•</span>
              <span>⏰ 상담 시간: 약 10-15분</span>
            </div>
          </div>
        </div>

        {/* 면책 조항 */}
        <div className="mt-6 text-center text-xs text-gray-500">
          본 서비스는 정보 제공 목적이며, 실제 보험 가입은 KB라이프를 통해 진행됩니다.
        </div>
      </div>
    </div>
  );
}