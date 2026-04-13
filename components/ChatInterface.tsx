'use client';

import { useState, useRef, useEffect } from 'react';
import { parseResponse } from '@/lib/parseResponse';
import ReactMarkdown from 'react-markdown';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Legend,
} from 'recharts';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  visualizations?: any[];
}

interface ChatInterfaceProps {
  userName: string;
  currentStage: number;
  onStageChange: (stage: number) => void;
}

/* ─── 리스크 레이더 (recharts) ─── */
function RiskRadar({ data, onNextStep }: {
  data: { category: string; risk_level: number; industry_avg: number }[];
  onNextStep?: () => void;
}) {
  const radarData = data.map(d => ({
    subject: d.category,
    score: d.risk_level,
    avg: d.industry_avg,
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="#e4e7ed" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#374151', fontWeight: 600 }}
          />
          <Radar
            name="내 리스크"
            dataKey="score"
            fill="#F5C400"
            fillOpacity={0.4}
            stroke="#D4A900"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#D4A900', stroke: 'white', strokeWidth: 1.5 } as any}
          />
          <Radar
            name="업계 평균"
            dataKey="avg"
            fill="none"
            stroke="#9ca3af"
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
          <Legend
            iconSize={8}
            wrapperStyle={{ fontSize: 10, color: '#6b7280' }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* 개선된 점수 범례 */}
      <div className="mt-3 space-y-2">
        {data.map(item => {
          const s = Math.round(item.risk_level);
          const isHigh = s >= 7;
          const isMid  = s >= 4 && s < 7;

          const getRiskStyle = () => {
            if (isHigh) return {
              bgColor: '#FEF2F2',
              borderColor: '#FCA5A5',
              badgeColor: '#DC2626',
              textColor: '#DC2626',
              progressColor: '#DC2626',
              label: '높음'
            };
            if (isMid) return {
              bgColor: '#FFFBEB',
              borderColor: '#FDE68A',
              badgeColor: '#D97706',
              textColor: '#D97706',
              progressColor: '#D97706',
              label: '보통'
            };
            return {
              bgColor: '#F0FDF4',
              borderColor: '#BBF7D0',
              badgeColor: '#059669',
              textColor: '#059669',
              progressColor: '#059669',
              label: '낮음'
            };
          };

          const style = getRiskStyle();

          return (
            <div
              key={item.category}
              className="flex items-center gap-3 px-3 py-3 rounded-lg border transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: style.bgColor,
                borderColor: style.borderColor
              }}
            >
              {/* 점수 원형 배지 */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: style.badgeColor }}
              >
                {s}
              </div>

              {/* 카테고리 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm font-semibold text-gray-800">{item.category}</div>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: style.textColor + '20',
                      color: style.textColor
                    }}
                  >
                    {style.label}
                  </span>
                </div>

                {/* 진행률 바 */}
                <div className="relative">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.min((item.risk_level / 10) * 100, 100)}%`,
                        backgroundColor: style.progressColor
                      }}
                    />
                    {/* 업계 평균 표시선 */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-gray-500"
                      style={{ left: `${Math.min((item.industry_avg / 10) * 100, 100)}%` }}
                    />
                  </div>

                  {/* 수치 표시 */}
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>내 점수: <strong style={{ color: style.textColor }}>{s}점</strong></span>
                    <span>업계 평균: {Math.round(item.industry_avg)}점</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 다음 단계 버튼 */}
      {onNextStep && (
        <div className="mt-4 text-center">
          <button
            onClick={onNextStep}
            className="inline-flex items-center px-6 py-3 bg-[#3b82f6] text-white text-sm font-semibold rounded-lg hover:bg-[#2563eb] transition-colors duration-200 shadow-sm"
          >
            보장 갭 분석 시작 →
          </button>
        </div>
      )}

    </div>
  );
}

/* ─── 개선된 보장갭 차트 ─── */
function GapChart({ data }: { data: { category: string; current_coverage: number; recommended_coverage: number; gap: number }[] }) {
  return (
    <div>
      {/* 헤더 및 범례 */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">보장 갭 분석 결과</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#10B981]" />
              <span className="text-gray-600">현재 보장</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#EF4444]" />
              <span className="text-gray-600">보장 갭</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#E5E7EB] border border-gray-300" />
              <span className="text-gray-600">미보장</span>
            </div>
          </div>
        </div>
      </div>

      {/* 개선된 카드 스타일 */}
      <div className="space-y-4">
        {data.map((item, index) => {
          const rec = item.recommended_coverage || 1;
          const coveredPct = Math.min(100, Math.round((item.current_coverage / rec) * 100));
          const gapPct = Math.min(100 - coveredPct, Math.round((item.gap / rec) * 100));
          const isOk = item.gap <= 0;

          // 상태별 스타일 설정
          const getStatusConfig = () => {
            if (isOk) return {
              bgColor: '#F0FDF4',
              borderColor: '#BBF7D0',
              iconColor: '#10B981',
              textColor: '#065F46',
              icon: '✅',
              status: '충족',
              statusBg: '#DCFCE7'
            };
            if (coveredPct < 40) return {
              bgColor: '#FEF2F2',
              borderColor: '#FECACA',
              iconColor: '#EF4444',
              textColor: '#991B1B',
              icon: '⚠️',
              status: '심각',
              statusBg: '#FEE2E2'
            };
            return {
              bgColor: '#FFFBEB',
              borderColor: '#FDE68A',
              iconColor: '#F59E0B',
              textColor: '#92400E',
              icon: '⚡',
              status: '주의',
              statusBg: '#FEF3C7'
            };
          };

          const config = getStatusConfig();

          return (
            <div
              key={item.category}
              className="group relative rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${config.bgColor} 0%, white 100%)`,
                borderColor: config.borderColor
              }}
            >
              <div className="p-4">
                {/* 헤더: 카테고리와 상태 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: config.iconColor + '20' }}
                    >
                      <span>{config.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">{item.category}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: config.statusBg,
                            color: config.textColor
                          }}
                        >
                          {config.status}
                        </span>
                        {!isOk && (
                          <span className="text-xs text-gray-600">
                            {Math.round(item.gap / 10000).toLocaleString()}만원 부족
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 충족률 퍼센트 */}
                  <div className="text-right">
                    <div
                      className="text-2xl font-bold"
                      style={{ color: config.iconColor }}
                    >
                      {coveredPct}%
                    </div>
                    <div className="text-xs text-gray-500">충족률</div>
                  </div>
                </div>

                {/* 진행률 바 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>보장 수준</span>
                    <span>{Math.round(item.recommended_coverage / 10000).toLocaleString()}만원 권장</span>
                  </div>

                  <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    {/* 현재 보장 */}
                    {coveredPct > 0 && (
                      <div
                        className="absolute left-0 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${coveredPct}%`,
                          backgroundColor: '#10B981',
                          animation: `slideIn 1.2s ease-out ${index * 0.2}s both`
                        }}
                      />
                    )}
                    {/* 보장 갭 */}
                    {gapPct > 0 && (
                      <div
                        className="absolute h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          left: `${coveredPct}%`,
                          width: `${gapPct}%`,
                          backgroundColor: '#EF4444',
                          animation: `slideIn 1.2s ease-out ${index * 0.2 + 0.3}s both`
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* 상세 정보 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white bg-opacity-60 rounded-lg p-3 border">
                    <div className="text-xs text-gray-500 mb-1">현재 보장</div>
                    <div className="font-semibold text-gray-800">
                      {Math.round(item.current_coverage / 10000).toLocaleString()}만원
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-60 rounded-lg p-3 border">
                    <div className="text-xs text-gray-500 mb-1">권장 보장</div>
                    <div className="font-semibold text-gray-800">
                      {Math.round(item.recommended_coverage / 10000).toLocaleString()}만원
                    </div>
                  </div>
                </div>
              </div>

              {/* 호버 이팩트 */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
            </div>
          );
        })}
      </div>

      {/* 요약 배너 */}
      {data.some(d => d.gap > 0) && (
        <div className="mt-4 p-3 rounded-lg flex items-start gap-2 text-xs"
          style={{ background: '#FFEBEE', color: '#B71C1C' }}>
          <span className="font-bold flex-shrink-0">!</span>
          <span>
            <strong>{data.filter(d => d.gap > 0).map(d => d.category).join(', ')}</strong> 항목에서 보장 갭이 확인되었습니다. 추가 보장 설계를 권장합니다.
          </span>
        </div>
      )}

    </div>
  );
}

interface GapAnalysisCardWithButtonProps {
  data: Array<{ category: string; current_coverage: number; recommended_coverage: number; gap: number; over_coverage: number }>;
  onNextStep?: () => void;
}

function GapAnalysisCardWithButton({ data, onNextStep }: GapAnalysisCardWithButtonProps) {
  return (
    <div className="space-y-4">
      <GapChart data={data} />
      {onNextStep && (
        <div className="flex justify-center">
          <button
            onClick={onNextStep}
            className="px-4 py-2 bg-[#3b82f6] text-white text-sm font-medium rounded-lg hover:bg-[#2563eb] transition-colors"
          >
            상품 매칭 시작 →
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Stage 9 완료 화면 ─── */
function CompletionCard({ messages, userName }: { messages: Message[]; userName: string }) {
  const [copied, setCopied] = useState(false);

  const allVizs = messages.flatMap(m => m.visualizations || []);
  const riskData = allVizs.find(v => v.type === 'risk_map')?.data as { category: string; risk_level: number }[] | undefined;
  const finalData = allVizs.find(v => v.type === 'final_report')?.data;
  // 최종 설계안이 있으면 확정 상품만, 없으면 마지막 product_match 사용
  const allProductVizs = allVizs.filter(v => v.type === 'product_match');
  const productData: { product_name: string; monthly_premium: number; key_benefits: string[] }[] | undefined =
    finalData?.products
      ? (finalData.products as any[]).map((p: any) => ({ product_name: p.name, monthly_premium: p.premium, key_benefits: [] }))
      : (allProductVizs[allProductVizs.length - 1]?.data ?? undefined);

  const totalPremium: number =
    finalData?.total_premium ??
    (productData?.reduce((sum: number, p: any) => sum + (p.monthly_premium || 0), 0) ?? 0);

  const handleCopy = () => {
    let text = `[KB라이프 보험 설계 요약 — ${userName}님]\n\n`;
    if (riskData) {
      text += `■ 리스크 프로파일\n`;
      riskData.forEach((r: any) => {
        text += `• ${r.category}: ${Math.round(r.risk_level)}점\n`;
      });
      text += '\n';
    }
    if (productData) {
      text += `■ 추천 상품\n`;
      productData.forEach((p: any) => {
        text += `• ${p.product_name}: ${p.monthly_premium?.toLocaleString()}원/월\n`;
        if (p.key_benefits?.[1]) text += `  → ${p.key_benefits[1]}\n`;
      });
      text += '\n';
    }
    if (totalPremium > 0) text += `■ 총 월납 보험료: ${totalPremium.toLocaleString()}원\n\n`;
    text += `상담 문의: 1588-9922 (평일 09:00–18:00)\n최종 가입은 KB라이프를 통해 진행됩니다.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mx-4 lg:mx-8 mb-6 rounded-2xl overflow-hidden border border-[#F5C400] shadow-[0_4px_20px_rgba(245,196,0,0.18)]">
      {/* 헤더 */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#1a3d6b' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F5C400' }}>
            <span className="font-bold text-[11px] text-[#1A1A1A]">KB</span>
          </div>
          <div>
            <div className="text-white text-sm font-bold">보험 설계 완료</div>
            <div className="text-[#9cb8d8] text-[11px] mt-0.5">{userName}님의 맞춤 설계안이 준비되었습니다</div>
          </div>
        </div>
        <div className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: '#F5C400', color: '#1A1A1A' }}>
          설계 완료
        </div>
      </div>

      <div className="bg-white p-5 space-y-4">
        {/* 리스크 프로파일 */}
        {riskData && (
          <div>
            <div className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide mb-2">리스크 프로파일</div>
            <div className="flex flex-wrap gap-2">
              {riskData.map((r: any) => {
                const score = Math.round(r.risk_level);
                const isHigh = score >= 7;
                const isMid = score >= 4;
                return (
                  <div key={r.category} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                    style={{ background: isHigh ? '#FFEBEE' : isMid ? '#FFF9DC' : '#F4F4F4' }}>
                    <span className="font-semibold" style={{ color: isHigh ? '#C62828' : isMid ? '#856A00' : '#6b7280' }}>{r.category}</span>
                    <span className="font-bold" style={{ color: isHigh ? '#C62828' : isMid ? '#856A00' : '#9ca3af' }}>{score}점</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 추천 상품 */}
        {productData && (
          <div>
            <div className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wide mb-2">추천 상품</div>
            <div className="space-y-1.5">
              {productData.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#f9fafb] border border-[#e4e7ed]">
                  <span className="text-sm font-medium text-[#111827]">{p.product_name}</span>
                  <span className="text-sm font-bold text-[#1a3d6b] flex-shrink-0 ml-3">{p.monthly_premium?.toLocaleString()}원<span className="text-[11px] font-normal text-[#9ca3af]">/월</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 총 보험료 */}
        {totalPremium > 0 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[#F5C400]" style={{ background: '#FFF9DC' }}>
            <span className="text-sm font-semibold text-[#374151]">총 월납 보험료</span>
            <span className="text-xl font-bold text-[#1a3d6b]">
              {totalPremium.toLocaleString()}원<span className="text-sm font-normal text-[#9ca3af]">/월</span>
            </span>
          </div>
        )}

        {/* CTA 버튼들 */}
        <div className="flex gap-2 pt-1">
          <a
            href="tel:15889922"
            className="flex-1 py-3 rounded-xl text-sm font-bold text-center"
            style={{ background: '#F5C400', color: '#1A1A1A' }}
          >
            1588-9922 전화 상담
          </a>
          <button
            onClick={handleCopy}
            className="px-4 py-3 rounded-xl text-sm font-bold border border-[#e4e7ed] text-[#374151] hover:bg-[#f9fafb] transition-colors flex-shrink-0"
          >
            {copied ? '복사됨 ✓' : '설계 복사'}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-3 rounded-xl text-sm font-bold border border-[#e4e7ed] text-[#374151] hover:bg-[#f9fafb] transition-colors flex-shrink-0"
          >
            저장
          </button>
        </div>

        <div className="text-[11px] text-[#9ca3af] text-center">
          최종 보험 가입은 KB라이프 담당자를 통해 진행됩니다
        </div>
      </div>
    </div>
  );
}

export default function ChatInterface({ userName, currentStage, onStageChange }: ChatInterfaceProps) {
  // sessionStorage에서 저장된 메시지 불러오기
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = sessionStorage.getItem('kblife-chat-messages');
      const savedUserName = sessionStorage.getItem('kblife-user-name');

      if (savedMessages && savedUserName === userName) {
        try {
          const parsed = JSON.parse(savedMessages);
          return parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        } catch {
          // 파싱 실패시 기본값 사용
        }
      }
    }

    // 기본 초기 메시지
    return [
      {
        id: '1',
        content: `안녕하세요 ${userName}님. KB라이프 보험 설계 상담입니다. 맞춤형 설계를 위해 기본정보부터 확인하겠습니다. 먼저 나이와 성별을 알려주세요.`,
        isUser: false,
        timestamp: new Date()
      }
    ];
  });
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 혼합형 폼 상태
  const [formData, setFormData] = useState({
    age: '',
    gender: ''
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 메시지 변경시 sessionStorage에 저장
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      sessionStorage.setItem('kblife-chat-messages', JSON.stringify(messages));
      sessionStorage.setItem('kblife-user-name', userName);
    }
  }, [messages, userName]);


  // 입력창 자동 포커스 - 메시지 전송 후와 로딩 완료 후
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isLoading, messages]);

  const handleSendWithMessage = async (message: string) => {
    if (!message.trim() || isLoading) {
      console.log('Message blocked:', { messageEmpty: !message.trim(), isLoading });
      return;
    }

    console.log('Sending message:', message);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const shownVisualizations = messages
        .filter(m => !m.isUser && m.visualizations?.length)
        .map(m => m.visualizations![0].type);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: currentStage,
          shownVisualizations,
          messages: [...messages, userMessage].map(m => ({
            role: m.isUser ? 'user' : 'assistant',
            content: m.content
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let aiContent = '';
      const decoder = new TextDecoder();

      const tempAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, tempAiMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        aiContent += chunk;

        // 스트리밍 중에 메시지 업데이트
        setMessages(prev =>
          prev.map(m =>
            m.id === tempAiMessage.id ? { ...m, content: aiContent } : m
          )
        );
      }

      console.log('Streaming completed, final content length:', aiContent.length);

      const parsed = parseResponse(aiContent);
      if (parsed.stage) {
        onStageChange(parsed.stage);
      }

      // 항상 cleanText로 업데이트 (JSON이 본문에 노출되는 문제 방지)
      setMessages(prev =>
        prev.map(m =>
          m.id === tempAiMessage.id
            ? {
                ...m,
                content: parsed.cleanText,
                ...(parsed.visualizations?.length ? { visualizations: parsed.visualizations } : {})
              }
            : m
        )
      );
    } catch (error) {
      console.error('Chat error:', error);

      // 에러 종류에 따라 다른 메시지 표시
      let errorMessage = '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = '네트워크 연결에 문제가 있습니다. 잠시 후 다시 시도해 주세요.';
        } else if (error.message.includes('AbortError')) {
          errorMessage = '요청이 중단되었습니다. 다시 시도해 주세요.';
        }
      }

      setMessages(prev =>
        prev.map(m =>
          m.id === tempAiMessage.id
            ? { ...m, content: errorMessage }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!currentMessage.trim() || isLoading) return;
    await handleSendWithMessage(currentMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f7fa]">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-5 lg:pt-6 pt-10">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            {/* Assistant avatar */}
            {!message.isUser && (
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mr-3 mt-0.5"
                style={{ background: '#1a3d6b' }}
              >
                <span className="font-bold text-[10px]" style={{ color: '#F5C400' }}>KB</span>
              </div>
            )}

            <div className={`max-w-2xl ${message.isUser ? 'max-w-md' : ''}`}>
              <div className={`px-4 py-3.5 rounded-xl text-sm leading-relaxed ${
                message.isUser
                  ? 'rounded-br-sm text-[#1A1A1A]'
                  : 'bg-white text-[#1f2937] border border-[#e4e7ed] rounded-tl-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
              }`}
              style={message.isUser ? { background: '#F5C400' } : {}}
              >
                {/* Text content — ReactMarkdown for assistant, plain for user */}
                {message.isUser ? (
                  <p className="whitespace-pre-wrap text-base">{message.content}</p>
                ) : (
                  <div className="prose prose-base max-w-none
                    prose-p:my-1.5 prose-p:leading-relaxed
                    prose-ul:my-2 prose-ul:pl-4
                    prose-ol:my-2 prose-ol:pl-4
                    prose-li:my-0.5
                    prose-strong:font-semibold prose-strong:text-[#111827]
                    prose-headings:font-semibold prose-headings:text-[#111827]
                    prose-h3:text-base prose-h4:text-base
                    prose-code:text-sm prose-code:bg-[#f4f4f4] prose-code:px-1 prose-code:rounded
                    [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{message.content
                      .replace(/#{1,}\s*STAGE\s*:\s*\d+\s*#{0,}/g, '')
                      .replace(/###STAGE:\d###/g, '')
                      .replace(/\*\*\*STAGE:\d\*\*\*/g, '')
                      .replace(/\*STAGE:\d\*/g, '')
                      .replace(/STAGE:\d/g, '')
                      .replace(/###\d###/g, '')
                      .replace(/##\d##/g, '')
                      .replace(/#\d#/g, '')
                      .replace(/([.!?)]) (- (?=[가-힣]))/g, '$1\n\n$2')
                      .replace(/([^\n])(- (?:사망|질병|상해|소득중단|노후|KB))/g, '$1\n\n$2')
                    }</ReactMarkdown>
                  </div>
                )}

                {/* Quick Response Buttons */}
                {!message.isUser && !isLoading && currentStage === 1 && (
                  <div className="mt-4">
                    {/* 나이와 성별 혼합형 폼 */}
                    {(message.content.includes('나이와 성별') || (message.content.includes('먼저 나이') && message.content.includes('성별'))) && !message.content.includes('직업') && !message.content.includes('고용') && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <div className="space-y-3">
                          {/* 나이 입력 */}
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-1">나이</label>
                            <input
                              type="number"
                              min="20"
                              max="70"
                              placeholder="예: 30"
                              value={formData.age}
                              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#F5C400] focus:border-[#F5C400] text-base"
                            />
                          </div>

                          {/* 성별 선택 */}
                          <div>
                            <label className="block text-base font-medium text-gray-700 mb-2">성별</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setFormData(prev => ({ ...prev, gender: '남성' }))}
                                className={`px-4 py-2 text-base rounded-md transition-colors ${
                                  formData.gender === '남성'
                                    ? 'bg-[#F5C400] text-black font-semibold'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                남성
                              </button>
                              <button
                                onClick={() => setFormData(prev => ({ ...prev, gender: '여성' }))}
                                className={`px-4 py-2 text-base rounded-md transition-colors ${
                                  formData.gender === '여성'
                                    ? 'bg-[#F5C400] text-black font-semibold'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                여성
                              </button>
                            </div>
                          </div>

                          {/* 전송 버튼 */}
                          <button
                            onClick={() => {
                              if (formData.age && formData.gender && !isLoading) {
                                handleSendWithMessage(`${formData.age}세 ${formData.gender}입니다`);
                                setFormData({ age: '', gender: '' });
                              }
                            }}
                            disabled={!formData.age || !formData.gender || isLoading}
                            className="w-full px-4 py-2 bg-[#1a3d6b] text-white text-sm font-semibold rounded-md hover:bg-[#164059] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            전송
                          </button>
                        </div>
                      </div>
                    )}


                  </div>
                )}

                {/* Visualizations */}
                {message.visualizations && message.visualizations.map((viz, index) => (
                  <div key={index} className="mt-5 bg-[#fafafa] rounded-xl border border-[#e4e7ed] overflow-hidden">

                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#e4e7ed]">
                      <span className="text-xs font-bold text-[#374151] tracking-wide">
                        {viz.type === 'risk_map'      && '리스크 맵'}
                        {viz.type === 'gap_analysis'  && '보장 갭 분석'}
                        {viz.type === 'product_match' && '상품 매칭 결과'}
                        {viz.type === 'final_report'  && '최종 설계안'}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full cursor-default"
                        style={{ background: '#FFF9DC', color: '#856A00' }}
                        title={
                          viz.type === 'risk_map' || viz.type === 'gap_analysis'
                            ? '출처: 통계청 2024년 생명표 · 질병 사망률 · 직업별 재해율'
                            : undefined
                        }
                      >
                        {viz.type === 'product_match'
                          ? '공시 데이터 기반 · 수수료 무관'
                          : (viz.type === 'risk_map' || viz.type === 'gap_analysis')
                          ? '통계청 2024 생명표 기반 ⓘ'
                          : '통계청 데이터 기반'}
                      </span>
                    </div>

                    <div className="p-4">

                      {/* risk_map → 레이더 차트 */}
                      {viz.type === 'risk_map' && (
                        <RiskRadar
                          data={viz.data}
                          onNextStep={() => handleSendWithMessage('보장 갭 분석을 시작해주세요')}
                        />
                      )}

                      {/* gap_analysis → 스택형 바 차트 */}
                      {viz.type === 'gap_analysis' && (
                        <GapAnalysisCardWithButton
                          data={viz.data}
                          onNextStep={() => handleSendWithMessage('상품 매칭을 시작해주세요')}
                        />
                      )}

                      {/* product_match - 개선된 카드 UI */}
                      {viz.type === 'product_match' && (
                        <div className="space-y-4">
                          {(viz.data as { product_name: string; match_score: number; monthly_premium: number; key_benefits: string[] }[]).map((product, i) => {
                            const matchScore = product.match_score || 80;
                            const scoreColor = matchScore >= 90 ? '#10B981' : matchScore >= 80 ? '#F59E0B' : '#EF4444';
                            const scoreBg = matchScore >= 90 ? '#ECFDF5' : matchScore >= 80 ? '#FEF3C7' : '#FEE2E2';

                            return (
                              <div key={i} className="bg-gradient-to-r from-white to-gray-50 border border-[#e4e7ed] rounded-xl p-5 hover:shadow-md transition-shadow duration-200">
                                {/* 헤더: 상품명과 매치 점수 */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h5 className="text-base font-bold text-[#111827] leading-snug mb-1">
                                      {product.product_name}
                                    </h5>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                                        style={{ backgroundColor: scoreBg, color: scoreColor }}
                                      >
                                        매칭도 {matchScore}%
                                      </span>
                                      {matchScore >= 90 && (
                                        <span className="text-xs text-green-600 font-medium">⭐ 최적</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* 보험료 강조 */}
                                  <div className="text-right ml-4">
                                    <div className="text-lg font-bold text-[#1a3d6b]">
                                      {product.monthly_premium?.toLocaleString()}원
                                    </div>
                                    <div className="text-xs text-[#9ca3af] font-medium">/월</div>
                                  </div>
                                </div>

                                {/* 혜택 리스트 */}
                                <div className="space-y-2 mt-3">
                                  {product.key_benefits?.map((benefit, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full mt-2 flex-shrink-0"></div>
                                      <span className="text-sm text-[#374151] leading-relaxed">{benefit}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* 하단 요약 정보 */}
                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                  <div className="text-xs text-[#6b7280]">
                                    KB라이프 공식 상품
                                  </div>
                                  <div className="text-xs text-[#6b7280]">
                                    월 보험료 기준
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* 다음 단계 버튼 */}
                          <div className="mt-6 text-center">
                            <button
                              onClick={() => handleSendWithMessage('최종 설계안을 확정해주세요')}
                              className="inline-flex items-center px-6 py-3 bg-[#3b82f6] text-white text-sm font-semibold rounded-lg hover:bg-[#2563eb] transition-colors duration-200 shadow-sm"
                            >
                              최종 설계안 확정 →
                            </button>
                          </div>
                        </div>
                      )}

                      {/* final_report */}
                      {viz.type === 'final_report' && (
                        <div className="bg-white border border-[#e4e7ed] rounded-lg p-5 text-center">
                          <div className="text-[11px] text-[#9ca3af] mb-1 uppercase tracking-wide">총 월납 보험료</div>
                          <div className="text-2xl font-bold text-[#1a3d6b] mb-1">
                            {viz.data?.total_premium?.toLocaleString()}원
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {viz.data?.products?.length}개 상품 최적 조합
                          </div>
                          {viz.data?.products && (
                            <div className="mt-4 pt-4 border-t border-[#e4e7ed] space-y-2">
                              {viz.data.products.map((p: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs text-[#374151]">
                                  <span>{p.name}</span>
                                  <span className="font-semibold">{p.premium?.toLocaleString()}원/월</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>

              {/* Timestamp */}
              <div className={`text-[10px] text-[#c0c8d4] mt-1.5 ${message.isUser ? 'text-right' : 'text-left'}`}>
                {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mr-3 mt-0.5"
              style={{ background: '#1a3d6b' }}
            >
              <span className="font-bold text-[10px]" style={{ color: '#F5C400' }}>KB</span>
            </div>
            <div className="bg-white border border-[#e4e7ed] rounded-xl rounded-tl-sm px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center space-x-1.5">
                <div className="thinking-dot" />
                <div className="thinking-dot" />
                <div className="thinking-dot" />
              </div>
            </div>
          </div>
        )}

        {currentStage >= 8 && <CompletionCard messages={messages} userName={userName} />}

        <div ref={messagesEndRef} />
      </div>


      {/* Input area */}
      <div className="border-t border-[#e4e7ed] bg-white px-4 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <div
            className="flex items-end gap-2 bg-white border rounded-xl px-3 pb-2 pt-2 transition-colors"
            style={{ borderColor: '#d1d5db' }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = '#F5C400')}
            onBlurCapture={e => (e.currentTarget.style.borderColor = '#d1d5db')}
          >
            <textarea
              ref={textareaRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="답변을 입력하세요 (Enter 전송 / Shift+Enter 줄바꿈)"
              className="flex-1 border-none outline-none resize-none text-base text-[#111827] placeholder:text-[#9ca3af] leading-relaxed bg-transparent py-1"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={!currentMessage.trim() || isLoading}
              className="flex-shrink-0 px-4 py-2.5 text-[#1A1A1A] text-sm font-bold rounded-lg transition-colors self-end disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: currentMessage.trim() && !isLoading ? '#F5C400' : '#e5e7eb' }}
            >
              {isLoading ? '처리 중' : '전송'}
            </button>
          </div>
          <div className="mt-2 text-[11px] text-[#c0c8d4] text-right">
            예: "35세 남성, 회사원, 기혼 2자녀"
          </div>
        </div>
      </div>
    </div>
  );
}
