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

  const canSubmit = name.trim() && agreedToPrivacy;

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[520px]">

        {/* Brand mark */}
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-9 h-9 bg-[#1a3d6b] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm tracking-tight">KB</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1a3d6b] leading-none">KB라이프생명</div>
            <div className="text-xs text-[#6b7280] mt-0.5">디지털 보험 설계 시스템</div>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-[1.75rem] font-bold text-[#111827] leading-tight tracking-tight mb-3">
            맞춤형 보험 진단
          </h1>
          <p className="text-sm text-[#6b7280] leading-relaxed max-w-sm">
            통계청 데이터 기반의 객관적 리스크 분석으로 고객님께 최적화된 보험 설계안을 제시합니다.
          </p>
        </div>

        {/* Service highlights — clean, no emoji */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: '통계 기반 진단', desc: '통계청 실데이터 분석' },
            { label: '보장갭 분석', desc: '현재 vs 필요 보장 비교' },
            { label: '맞춤 상품 설계', desc: '개인 최적화 추천' },
          ].map(({ label, desc }) => (
            <div
              key={label}
              className="bg-white border border-[#e4e7ed] rounded-lg p-3.5"
            >
              <div className="text-xs font-semibold text-[#111827] mb-1 leading-snug">{label}</div>
              <div className="text-[11px] text-[#9ca3af] leading-snug">{desc}</div>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="bg-white border border-[#e4e7ed] rounded-xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[#374151] mb-1.5"
              >
                성함
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="input-field text-base"
                required
                autoFocus
              />
            </div>

            {/* Privacy consent */}
            <div className="border border-[#e4e7ed] rounded-lg overflow-hidden">
              <div className="bg-[#f9fafb] px-4 py-3 border-b border-[#e4e7ed]">
                <span className="text-xs font-semibold text-[#374151] uppercase tracking-wide">
                  개인정보 수집·이용 동의
                </span>
              </div>
              <div className="px-4 py-3">
                <div className="text-xs text-[#6b7280] space-y-1.5 max-h-28 overflow-y-auto leading-relaxed">
                  <div><span className="font-medium text-[#374151]">수집목적:</span> 보험 상담 및 맞춤형 상품 추천</div>
                  <div><span className="font-medium text-[#374151]">수집항목:</span> 이름, 나이, 성별, 직업, 가족구성, 건강정보, 기존보험현황</div>
                  <div><span className="font-medium text-[#374151]">보유기간:</span> 상담 완료 후 즉시 삭제 (세션 종료 시)</div>
                  <div><span className="font-medium text-[#374151]">거부권리:</span> 동의를 거부할 수 있으나 상담 서비스 이용이 제한됩니다.</div>
                </div>
                <label className="flex items-center space-x-2.5 mt-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    id="privacy-agreement"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    className="w-4 h-4 rounded border-[#d1d5db] text-[#1a3d6b] focus:ring-[#1a3d6b] focus:ring-offset-0 focus:ring-1 cursor-pointer"
                  />
                  <span className="text-xs text-[#374151] group-hover:text-[#111827] transition-colors">
                    개인정보 수집·이용에 동의합니다
                    <span className="text-[#dc2626] ml-0.5">*</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="btn-primary w-full py-3 px-5 text-sm"
            >
              {canSubmit ? '진단 시작하기' : '성함 입력 및 동의 필요'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between text-xs text-[#9ca3af]">
          <span>상담 문의 1588-9922 (평일 09:00–18:00)</span>
          <span>소요 시간 약 10–15분</span>
        </div>

        <div className="mt-3 text-[11px] text-[#c0c8d4] text-center">
          본 서비스는 정보 제공 목적이며, 실제 보험 가입은 KB라이프를 통해 진행됩니다.
        </div>
      </div>
    </div>
  );
}
