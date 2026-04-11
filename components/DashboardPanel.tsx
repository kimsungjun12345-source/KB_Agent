'use client';

import { useState } from 'react';
import MetricCard from './MetricCard';

interface DashboardData {
  riskScore: number;
  coverageRate: number;
  monthlyPremium: number;
  riskAnalysis: {
    health: number;
    family: number;
    financial: number;
    lifestyle: number;
    career: number;
  };
  gapAnalysis: {
    current: number;
    recommended: number;
    gap: number;
  };
  productMatches: Array<{
    name: string;
    premium: number;
    coverage: string;
    score: number;
  }>;
}

export default function DashboardPanel() {
  const [activeSection, setActiveSection] = useState<'metrics' | 'risk' | 'gap' | 'products'>('metrics');

  // Mock data - replace with actual data
  const data: DashboardData = {
    riskScore: 73,
    coverageRate: 82,
    monthlyPremium: 245000,
    riskAnalysis: {
      health: 85,
      family: 60,
      financial: 70,
      lifestyle: 80,
      career: 90
    },
    gapAnalysis: {
      current: 5000,
      recommended: 12000,
      gap: 7000
    },
    productMatches: [
      { name: 'KB 종합보장보험', premium: 185000, coverage: '1억원', score: 94 },
      { name: 'KB 건강보험', premium: 135000, coverage: '5천만원', score: 87 },
      { name: 'KB 연금보험', premium: 280000, coverage: '2억원', score: 82 }
    ]
  };

  return (
    <div className="h-full bg-white overflow-y-auto">
      {/* Section Navigation */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex space-x-6">
          {[
            { key: 'metrics', label: '핵심 지표' },
            { key: 'risk', label: '리스크 분석' },
            { key: 'gap', label: '보장 갭' },
            { key: 'products', label: '상품 매칭' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as any)}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg transition-colors
                ${activeSection === key
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics Section */}
        {activeSection === 'metrics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="리스크 점수"
                value={`${data.riskScore}점`}
                subtitle="100점 만점"
                color="blue"
                trend="neutral"
                icon={<span className="text-sm">📊</span>}
              />
              <MetricCard
                title="보장 커버율"
                value={`${data.coverageRate}%`}
                subtitle="권장 수준 대비"
                color="green"
                trend="up"
                icon={<span className="text-sm">🛡️</span>}
              />
              <MetricCard
                title="월 예상 보험료"
                value={`${data.monthlyPremium.toLocaleString()}원`}
                subtitle="최적화 기준"
                color="orange"
                trend="down"
                icon={<span className="text-sm">💰</span>}
              />
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">ℹ️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">분석 완료</h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    고객님의 프로필을 기반으로 리스크 분석이 완료되었습니다.
                    현재 보장 수준은 권장 기준 대비 82% 수준이며,
                    월 24만원 수준의 보험료로 최적화된 보장이 가능합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Analysis Section */}
        {activeSection === 'risk' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">리스크 카테고리 분석</h2>
              <div className="space-y-4">
                {Object.entries(data.riskAnalysis).map(([category, score]) => {
                  const categoryNames: Record<string, string> = {
                    health: '건강 리스크',
                    family: '가족 리스크',
                    financial: '재정 리스크',
                    lifestyle: '생활 리스크',
                    career: '직업 리스크'
                  };

                  return (
                    <div key={category} className="bg-white rounded-lg border border-gray-100 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{categoryNames[category]}</span>
                        <span className="text-sm text-gray-600">{score}점</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            score >= 80 ? 'bg-red-500' :
                            score >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Gap Analysis Section */}
        {activeSection === 'gap' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">보장 갭 분석</h2>
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">현재 보장액</span>
                    <span className="font-semibold text-gray-900">{data.gapAnalysis.current.toLocaleString()}만원</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">권장 보장액</span>
                    <span className="font-semibold text-gray-900">{data.gapAnalysis.recommended.toLocaleString()}만원</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 font-medium">부족 보장액</span>
                      <span className="font-bold text-red-600">{data.gapAnalysis.gap.toLocaleString()}만원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Matching Section */}
        {activeSection === 'products' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">맞춤 상품 추천</h2>
              <div className="space-y-4">
                {data.productMatches.map((product, index) => (
                  <div key={index} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
                            {product.score}점
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>보장액: {product.coverage}</div>
                          <div>월 보험료: {product.premium.toLocaleString()}원</div>
                        </div>
                      </div>
                      <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                        상세보기
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-6 space-y-3">
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                맞춤 설계서 받기
              </button>
              <button className="w-full bg-white border border-gray-200 text-gray-900 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                전문가 상담 신청
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}