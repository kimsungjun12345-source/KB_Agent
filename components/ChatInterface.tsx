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
function RiskRadar({ data }: { data: { category: string; risk_level: number; industry_avg: number }[] }) {
  const radarData = data.map(d => ({
    subject: d.category,
    score: Math.round(d.risk_level / 10),
    avg: Math.round(d.industry_avg / 10),
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
          <PolarGrid stroke="#e4e7ed" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 10, fill: '#374151', fontWeight: 600 }}
          />
          <Radar
            name="내 리스크"
            dataKey="score"
            fill="#F5C400"
            fillOpacity={0.35}
            stroke="#D4A900"
            strokeWidth={2}
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

      {/* 점수 범례 */}
      <div className="mt-2 space-y-2">
        {data.map(item => {
          const s = Math.round(item.risk_level / 10);
          const isHigh = s >= 7;
          const isMid  = s >= 4 && s < 7;
          return (
            <div
              key={item.category}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{ background: isHigh ? '#FFF0F0' : isMid ? '#FFF9DC' : '#F4F4F4' }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: isHigh ? '#C0392B' : isMid ? '#F5C400' : '#C4C4C4',
                  color: isHigh ? '#fff' : '#1A1A1A',
                }}
              >
                {s}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#1A1A1A]">{item.category}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-[3px] bg-[#e4e7ed] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${item.risk_level}%`,
                        background: isHigh ? '#C0392B' : isMid ? '#D4A900' : '#C4C4C4',
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-[#9ca3af] flex-shrink-0">
                    업계 {item.industry_avg}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── 보장갭 스택형 바 차트 ─── */
function GapChart({ data }: { data: { category: string; current_coverage: number; recommended_coverage: number; gap: number }[] }) {
  return (
    <div>
      {/* 범례 */}
      <div className="flex items-center gap-4 mb-3 px-1">
        <div className="flex items-center gap-1.5 text-[10px] text-[#6b7280]">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#66BB6A]" />
          현재 보장
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#6b7280]">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#EF5350]" />
          보장 갭
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#6b7280]">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#e4e7ed] border border-[#d1d5db]" />
          미보장
        </div>
      </div>

      <div className="space-y-3">
        {data.map(item => {
          const rec = item.recommended_coverage || 1;
          const coveredPct = Math.min(100, Math.round((item.current_coverage / rec) * 100));
          const gapPct     = Math.min(100 - coveredPct, Math.round((item.gap / rec) * 100));
          const isOk = item.gap <= 0;
          const badgeColor = coveredPct < 40 ? { bg: '#FFEBEE', text: '#C62828' }
                           : coveredPct < 80 ? { bg: '#FFF9DC', text: '#856A00' }
                           : { bg: '#E8F5E9', text: '#2E7D32' };

          return (
            <div key={item.category}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-[#374151] w-16 flex-shrink-0">
                  {item.category}
                </span>
                <div className="flex-1 mx-2 h-6 bg-[#f4f4f4] rounded-md overflow-hidden flex">
                  {/* 충족 구간 */}
                  {coveredPct > 0 && (
                    <div
                      className="h-full transition-all duration-700 ease-out"
                      style={{ width: `${coveredPct}%`, background: '#66BB6A' }}
                    />
                  )}
                  {/* 갭 구간 */}
                  {gapPct > 0 && (
                    <div
                      className="h-full transition-all duration-700 ease-out"
                      style={{ width: `${gapPct}%`, background: '#EF5350' }}
                    />
                  )}
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: badgeColor.bg, color: badgeColor.text }}
                >
                  {isOk ? '충족' : `갭 ${Math.round(item.gap / 10000)}만`}
                </span>
              </div>
              <div className="flex justify-between text-[9px] text-[#9ca3af] px-0 ml-16 mr-[68px]">
                <span>현재 {Math.round(item.current_coverage / 10000)}만원</span>
                <span>권장 {Math.round(item.recommended_coverage / 10000)}만원</span>
              </div>
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

export default function ChatInterface({ userName, currentStage, onStageChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `안녕하세요 ${userName}님. KB라이프 디지털 보험 설계 시스템입니다.\n\n통계청 데이터를 기반으로 객관적인 리스크 분석을 진행하고, 최적화된 보험 설계안을 제시해 드립니다.\n\n총 9단계에 걸쳐 체계적으로 진행되며 약 10–15분 소요됩니다:\n\n**1–3단계**: 정보 수집 → 리스크 진단 → 보장갭 분석\n**4–6단계**: 제도 안내 → 상품 추천 → 상세 상담\n**7–9단계**: 설계 조정 → 최종 확인 → 가입 안내\n\n먼저 **기본 정보 수집**을 시작하겠습니다. 나이와 성별을 알려주시겠어요?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentMessage,
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
      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        content += decoder.decode(value);
      }

      const parsed = parseResponse(content);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: parsed.cleanText,
        isUser: false,
        timestamp: new Date(),
        visualizations: parsed.visualizations
      };

      setMessages(prev => [...prev, botMessage]);

      const stageMatch = content.match(/###STAGE:(\d+)###/);
      if (stageMatch) {
        const newStage = parseInt(stageMatch[1]);
        if (newStage !== currentStage) {
          onStageChange(newStage);
        }
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        content: '일시적인 오류가 발생했습니다. 다시 시도해 주세요.',
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
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
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none
                    prose-p:my-1 prose-p:leading-relaxed
                    prose-ul:my-1.5 prose-ul:pl-4
                    prose-ol:my-1.5 prose-ol:pl-4
                    prose-li:my-0.5
                    prose-strong:font-semibold prose-strong:text-[#111827]
                    prose-headings:font-semibold prose-headings:text-[#111827]
                    prose-h3:text-sm prose-h4:text-sm
                    prose-code:text-xs prose-code:bg-[#f4f4f4] prose-code:px-1 prose-code:rounded
                    [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
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
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{ background: '#FFF9DC', color: '#856A00' }}
                      >
                        통계청 데이터 기반
                      </span>
                    </div>

                    <div className="p-4">

                      {/* risk_map → 레이더 차트 */}
                      {viz.type === 'risk_map' && (
                        <RiskRadar data={viz.data} />
                      )}

                      {/* gap_analysis → 스택형 바 차트 */}
                      {viz.type === 'gap_analysis' && (
                        <GapChart data={viz.data} />
                      )}

                      {/* product_match */}
                      {viz.type === 'product_match' && (
                        <div className="space-y-3">
                          {(viz.data as { product_name: string; match_score: number; monthly_premium: number; key_benefits: string[] }[]).map((product, i) => (
                            <div key={i} className="bg-white border border-[#e4e7ed] rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="text-sm font-semibold text-[#111827] leading-snug">{product.product_name}</h5>
                                <span className="text-sm font-bold text-[#1a3d6b] ml-3 flex-shrink-0">
                                  {product.monthly_premium?.toLocaleString()}원
                                  <span className="text-[11px] font-normal text-[#9ca3af]">/월</span>
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] mt-2">
                                <div className="flex flex-wrap gap-1">
                                  {product.key_benefits?.slice(0, 2).map((b, j) => (
                                    <span key={j} className="bg-[#f5f7fa] text-[#6b7280] px-1.5 py-0.5 rounded">{b}</span>
                                  ))}
                                </div>
                                <span
                                  className="px-2 py-0.5 rounded font-bold ml-2 flex-shrink-0 text-[11px]"
                                  style={{ background: '#FFF9DC', color: '#856A00' }}
                                >
                                  {product.match_score}점
                                </span>
                              </div>
                            </div>
                          ))}
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
              className="flex-1 border-none outline-none resize-none text-sm text-[#111827] placeholder:text-[#9ca3af] leading-relaxed bg-transparent py-1"
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
