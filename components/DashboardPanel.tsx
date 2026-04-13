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

type Section = 'metrics' | 'risk' | 'gap' | 'products';

const NAV_ITEMS: { key: Section; label: string }[] = [
  { key: 'metrics',  label: '핵심 지표' },
  { key: 'risk',     label: '리스크 분석' },
  { key: 'gap',      label: '보장 갭' },
  { key: 'products', label: '상품 매칭' },
];

const RISK_LABELS: Record<string, string> = {
  health:    '건강',
  family:    '가족',
  financial: '재정',
  lifestyle: '생활',
  career:    '직업',
};

export default function DashboardPanel() {
  const [activeSection, setActiveSection] = useState<Section>('metrics');

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
      { name: 'KB 종합보장보험', premium: 185000, coverage: '1억원',  score: 94 },
      { name: 'KB 건강보험',    premium: 135000, coverage: '5천만원', score: 87 },
      { name: 'KB 연금보험',    premium: 280000, coverage: '2억원',  score: 82 }
    ]
  };

  return (
    <div className="h-full bg-[#f5f7fa] flex flex-col overflow-hidden">

      {/* Tab nav */}
      <div className="bg-white border-b border-[#e4e7ed] px-5 flex-shrink-0">
        <div className="flex space-x-0">
          {NAV_ITEMS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`px-4 py-3.5 text-xs font-semibold border-b-2 transition-colors ${
                activeSection === key
                  ? 'border-[#1a3d6b] text-[#1a3d6b]'
                  : 'border-transparent text-[#6b7280] hover:text-[#374151]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto p-5">

        {/* ── Key Metrics ── */}
        {activeSection === 'metrics' && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                title="리스크 점수"
                value={`${data.riskScore}점`}
                subtitle="100점 만점 기준"
                color="navy"
                trend="neutral"
              />
              <MetricCard
                title="보장 커버율"
                value={`${data.coverageRate}%`}
                subtitle="권장 수준 대비"
                color="green"
                trend="up"
              />
              <MetricCard
                title="월 예상 보험료"
                value={`${data.monthlyPremium.toLocaleString()}원`}
                subtitle="최적화 기준"
                color="blue"
                trend="down"
              />
            </div>

            <div className="bg-white border border-[#e4e7ed] rounded-xl p-5">
              <div className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">분석 결과</div>
              <p className="text-sm text-[#6b7280] leading-relaxed">
                고객님의 프로필을 기반으로 리스크 분석이 완료되었습니다.
                현재 보장 수준은 권장 기준 대비 <strong className="font-semibold text-[#111827]">82%</strong> 수준이며,
                월 <strong className="font-semibold text-[#111827]">24만 5천원</strong> 수준의 보험료로 최적화된 보장이 가능합니다.
              </p>
            </div>
          </div>
        )}

        {/* ── Risk Analysis ── */}
        {activeSection === 'risk' && (
          <div className="space-y-3 animate-fade-in">
            <div className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-4">
              리스크 카테고리
            </div>
            {Object.entries(data.riskAnalysis).map(([category, score]) => {
              const barColor =
                score >= 80 ? '#dc2626' :
                score >= 60 ? '#d97706' : '#059669';
              const levelLabel =
                score >= 80 ? '높음' :
                score >= 60 ? '보통' : '낮음';

              return (
                <div key={category} className="bg-white border border-[#e4e7ed] rounded-lg px-4 py-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#374151]">
                      {RISK_LABELS[category]}
                    </span>
                    <div className="flex items-center space-x-2.5">
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                        score >= 80 ? 'bg-[#fef2f2] text-[#dc2626]' :
                        score >= 60 ? 'bg-[#fffbeb] text-[#d97706]' :
                        'bg-[#ecfdf5] text-[#059669]'
                      }`}>{levelLabel}</span>
                      <span className="text-sm font-bold text-[#111827]">{score}</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-[#e4e7ed] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${score}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Gap Analysis ── */}
        {activeSection === 'gap' && (
          <div className="animate-fade-in">
            <div className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-4">
              보장 갭 분석
            </div>
            <div className="bg-white border border-[#e4e7ed] rounded-xl overflow-hidden">
              <div className="divide-y divide-[#f1f3f7]">
                <div className="flex justify-between items-center px-5 py-4">
                  <span className="text-sm text-[#6b7280]">현재 보장액</span>
                  <span className="text-sm font-semibold text-[#374151]">
                    {data.gapAnalysis.current.toLocaleString()}만원
                  </span>
                </div>
                <div className="flex justify-between items-center px-5 py-4">
                  <span className="text-sm text-[#6b7280]">권장 보장액</span>
                  <span className="text-sm font-semibold text-[#374151]">
                    {data.gapAnalysis.recommended.toLocaleString()}만원
                  </span>
                </div>
                <div className="flex justify-between items-center px-5 py-4 bg-[#fef2f2]">
                  <span className="text-sm font-semibold text-[#374151]">부족 보장액</span>
                  <span className="text-sm font-bold text-[#dc2626]">
                    {data.gapAnalysis.gap.toLocaleString()}만원
                  </span>
                </div>
              </div>
            </div>

            {/* Visual bar */}
            <div className="mt-4 bg-white border border-[#e4e7ed] rounded-xl p-5">
              <div className="text-xs text-[#9ca3af] mb-3">보장 커버율</div>
              <div className="w-full h-2 bg-[#e4e7ed] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1a3d6b] rounded-full"
                  style={{ width: `${(data.gapAnalysis.current / data.gapAnalysis.recommended) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-[#9ca3af] mt-1.5">
                <span>현재 {Math.round((data.gapAnalysis.current / data.gapAnalysis.recommended) * 100)}%</span>
                <span>권장 100%</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Product Matching ── */}
        {activeSection === 'products' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-4">
              추천 상품
            </div>
            {data.productMatches.map((product, index) => (
              <div key={index} className="bg-white border border-[#e4e7ed] rounded-xl p-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#111827] mb-1">{product.name}</h3>
                    <div className="flex items-center space-x-2 text-xs text-[#6b7280]">
                      <span>보장액 {product.coverage}</span>
                      <span className="text-[#d1d5db]">·</span>
                      <span className="bg-[#eef2f8] text-[#1a3d6b] px-1.5 py-0.5 rounded font-medium">
                        {product.score}점
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="text-xs text-[#9ca3af] mb-0.5">월 보험료</div>
                    <div className="text-base font-bold text-[#1a3d6b]">
                      {product.premium.toLocaleString()}원
                    </div>
                  </div>
                </div>
                <button className="w-full text-xs font-medium text-[#1a3d6b] border border-[#c5d3e8] rounded-lg py-2 hover:bg-[#eef2f8] transition-colors">
                  상세 보기
                </button>
              </div>
            ))}

            <div className="space-y-2.5 pt-2 border-t border-[#e4e7ed]">
              <button className="w-full py-3 px-4 bg-[#1a3d6b] text-white text-sm font-semibold rounded-lg hover:bg-[#1e4d87] transition-colors">
                맞춤 설계서 받기
              </button>
              <button className="w-full py-3 px-4 bg-white border border-[#d1d5db] text-sm font-medium text-[#374151] rounded-lg hover:bg-[#f9fafb] transition-colors">
                전문가 상담 신청
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
