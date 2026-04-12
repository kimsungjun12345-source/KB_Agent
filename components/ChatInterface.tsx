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
    score: d.risk_level,
    avg: d.industry_avg,
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
          const s = Math.round(item.risk_level);
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

      {/* 다음 단계 버튼 */}
      <div className="mt-4 pt-3 border-t border-[#e4e7ed]">
        <button
          onClick={() => {
            // 자동으로 보장 갭 분석을 요청하는 메시지 전송
            const event = new CustomEvent('sendNextStageMessage', {
              detail: { message: '이제 현재 보장 상태를 점검하고 보장 갭을 분석해주세요.' }
            });
            window.dispatchEvent(event);
          }}
          className="w-full py-2.5 px-4 bg-[#F5C400] hover:bg-[#E6B500] text-[#1A1A1A] text-sm font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <span>📊</span>
          <span>보장 갭 분석하기</span>
          <span>→</span>
        </button>
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

      {/* 다음 단계 버튼 */}
      <div className="mt-4 pt-3 border-t border-[#e4e7ed]">
        <button
          onClick={() => {
            const event = new CustomEvent('sendNextStageMessage', {
              detail: { message: '맞춤형 상품을 추천해주세요. 제가 필요한 보장에 가장 적합한 상품을 찾아주세요.' }
            });
            window.dispatchEvent(event);
          }}
          className="w-full py-2.5 px-4 bg-[#1a3d6b] hover:bg-[#164059] text-white text-sm font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <span>🎯</span>
          <span>맞춤 상품 추천받기</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

/* ─── Stage 9 완료 화면 ─── */
function CompletionCard({ messages, userName }: { messages: Message[]; userName: string }) {
  const [copied, setCopied] = useState(false);

  const allVizs = messages.flatMap(m => m.visualizations || []);
  const riskData = allVizs.find(v => v.type === 'risk_map')?.data as { category: string; risk_level: number }[] | undefined;
  const productData = allVizs.find(v => v.type === 'product_match')?.data as { product_name: string; monthly_premium: number; key_benefits: string[] }[] | undefined;
  const finalData = allVizs.find(v => v.type === 'final_report')?.data;

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

  // 다음 단계 이벤트 리스너
  useEffect(() => {
    const handleNextStageMessage = (event: CustomEvent) => {
      if (!isLoading) {
        setCurrentMessage(event.detail.message);
        // 약간의 지연 후 자동으로 전송
        setTimeout(() => {
          handleSendWithMessage(event.detail.message);
        }, 100);
      }
    };

    window.addEventListener('sendNextStageMessage', handleNextStageMessage as EventListener);
    return () => {
      window.removeEventListener('sendNextStageMessage', handleNextStageMessage as EventListener);
    };
  }, [isLoading]);

  // 입력창 자동 포커스 - 메시지 전송 후와 로딩 완료 후
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isLoading, messages]);

  const handleSendWithMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

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

        setMessages(prev =>
          prev.map(m =>
            m.id === tempAiMessage.id ? { ...m, content: aiContent } : m
          )
        );
      }

      const parsed = parseResponse(aiContent);
      if (parsed.stage) {
        onStageChange(parsed.stage);
      }

      if (parsed.visualizations?.length) {
        setMessages(prev =>
          prev.map(m =>
            m.id === tempAiMessage.id
              ? { ...m, content: parsed.cleanText, visualizations: parsed.visualizations }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev =>
        prev.map(m =>
          m.id === tempAiMessage.id
            ? { ...m, content: '죄송합니다. 오류가 발생했습니다. 다시 시도해 주세요.' }
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
                    }</ReactMarkdown>
                  </div>
                )}

                {/* Quick Response Buttons */}
                {!message.isUser && !isLoading && currentStage === 1 && (
                  <div className="mt-4">
                    {/* 나이와 성별 혼합형 폼 */}
                    {message.content.includes('나이와 성별') && (
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
                              if (formData.age && formData.gender) {
                                handleSendWithMessage(`${formData.age}세 ${formData.gender}입니다`);
                                setFormData({ age: '', gender: '' });
                              }
                            }}
                            disabled={!formData.age || !formData.gender}
                            className="w-full px-4 py-2 bg-[#1a3d6b] text-white text-sm font-semibold rounded-md hover:bg-[#164059] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                          >
                            전송
                          </button>
                        </div>
                      </div>
                    )}


                    {/* 건강 상태 질문 */}
                    {(message.content.includes('건강') || message.content.includes('질환')) && !message.content.includes('가족력') && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleSendWithMessage("특별한 질환 없음")}
                          className="px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                        >
                          특별한 질환 없음
                        </button>
                        <button
                          onClick={() => handleSendWithMessage("고혈압")}
                          className="px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                        >
                          고혈압
                        </button>
                        <button
                          onClick={() => handleSendWithMessage("당뇨")}
                          className="px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                        >
                          당뇨
                        </button>
                      </div>
                    )}

                    {/* 가족력 질문 */}
                    {message.content.includes('가족력') && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleSendWithMessage("가족력 없음")}
                          className="px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                        >
                          가족력 없음
                        </button>
                        <button
                          onClick={() => handleSendWithMessage("암 가족력")}
                          className="px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                        >
                          암 가족력
                        </button>
                        <button
                          onClick={() => handleSendWithMessage("심혈관 가족력")}
                          className="px-3 py-1.5 text-xs bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                        >
                          심혈관 가족력
                        </button>
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
                                  {product.key_benefits?.[0] && (
                                    <span className="bg-[#f5f7fa] text-[#6b7280] px-1.5 py-0.5 rounded">{product.key_benefits[0]}</span>
                                  )}
                                </div>
                                <span
                                  className="px-2 py-0.5 rounded font-bold ml-2 flex-shrink-0 text-[11px]"
                                  style={{ background: '#FFF9DC', color: '#856A00' }}
                                >
                                  {product.match_score}점
                                </span>
                              </div>
                              {product.key_benefits?.[1] && (
                                <div className="mt-2.5 pt-2.5 border-t border-[#f0f0f0]">
                                  <div className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-wide mb-1">이 상품이 선택된 이유</div>
                                  <div className="text-xs text-[#374151] leading-relaxed">{product.key_benefits[1]}</div>
                                </div>
                              )}
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

        {currentStage >= 9 && <CompletionCard messages={messages} userName={userName} />}

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
