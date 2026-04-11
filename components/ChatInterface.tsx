'use client';

import { useState, useRef, useEffect } from 'react';
import { parseResponse } from '@/lib/parseResponse';

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: currentStage,
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

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;

      if (line.includes('**')) {
        const parts = line.split(/\*\*([^*]+)\*\*/);
        return (
          <div key={index} className="mb-1">
            {parts.map((part, i) =>
              i % 2 === 1
                ? <strong key={i} className="font-semibold text-[#111827]">{part}</strong>
                : part
            )}
          </div>
        );
      }

      return <div key={index} className="mb-1 leading-relaxed">{line}</div>;
    });
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
              <div className="flex-shrink-0 w-7 h-7 bg-[#1a3d6b] rounded-full flex items-center justify-center mr-3 mt-0.5">
                <span className="text-white text-[10px] font-bold">KB</span>
              </div>
            )}

            <div className={`max-w-2xl ${message.isUser ? 'max-w-md' : ''}`}>
              <div className={`px-4 py-3.5 rounded-xl text-sm leading-relaxed ${
                message.isUser
                  ? 'bg-[#1a3d6b] text-white rounded-br-sm'
                  : 'bg-white text-[#1f2937] border border-[#e4e7ed] rounded-tl-sm shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
              }`}>
                {formatMessage(message.content)}

                {/* Visualizations */}
                {message.visualizations && message.visualizations.map((viz, index) => (
                  <div key={index} className="mt-5 bg-[#f9fafb] rounded-lg border border-[#e4e7ed] overflow-hidden">

                    {viz.type === 'risk_map' && (
                      <div className="p-4">
                        <div className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-4">
                          리스크 프로파일
                        </div>
                        <div className="space-y-3">
                          {(viz.data as {category:string; risk_level:number}[]).map((item) => {
                            const s = Math.round(item.risk_level / 10);
                            const level = s < 4 ? 'low' : s < 7 ? 'mid' : 'high';
                            const barColor = level === 'low' ? '#059669' : level === 'mid' ? '#d97706' : '#dc2626';
                            const levelLabel = level === 'low' ? '낮음' : level === 'mid' ? '보통' : '높음';
                            return (
                              <div key={item.category}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-medium text-[#374151]">{item.category}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[11px] text-[#9ca3af]">{levelLabel}</span>
                                    <span className="text-xs font-semibold text-[#111827]">{s}<span className="text-[10px] text-[#9ca3af] font-normal">/10</span></span>
                                  </div>
                                </div>
                                <div className="w-full h-1.5 bg-[#e4e7ed] rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${item.risk_level}%`, backgroundColor: barColor }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {viz.type === 'gap_analysis' && (
                      <div className="p-4">
                        <div className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-4">
                          보장갭 분석
                        </div>
                        <div className="space-y-4">
                          {(viz.data as {category:string; current_coverage:number; recommended_coverage:number; gap:number}[]).map((item) => (
                            <div key={item.category} className="border-b border-[#e4e7ed] pb-4 last:border-0 last:pb-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-[#374151]">{item.category}</span>
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                  item.gap > 0 ? 'bg-[#fef2f2] text-[#dc2626]' : 'bg-[#ecfdf5] text-[#059669]'
                                }`}>
                                  {item.gap > 0 ? `부족 ${(item.gap/1000).toFixed(0)}점` : '충분'}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                <div>
                                  <div className="flex justify-between text-[10px] text-[#9ca3af] mb-1">
                                    <span>필요 보장</span>
                                    <span>{(item.recommended_coverage/1000).toFixed(0)}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-[#e4e7ed] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#1a3d6b] rounded-full" style={{ width: `${Math.min((item.recommended_coverage / 10000) * 100, 100)}%` }} />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-[10px] text-[#9ca3af] mb-1">
                                    <span>현재 보장</span>
                                    <span>{(item.current_coverage/1000).toFixed(0)}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-[#e4e7ed] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#2563eb] rounded-full opacity-60" style={{ width: `${Math.min((item.current_coverage / 10000) * 100, 100)}%` }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {viz.type === 'product_match' && (
                      <div className="p-4">
                        <div className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-4">
                          추천 상품
                        </div>
                        <div className="space-y-3">
                          {(viz.data as {product_name:string; match_score:number; monthly_premium:number; key_benefits:string[]}[]).map((product, index) => (
                            <div key={index} className="bg-white border border-[#e4e7ed] rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="text-sm font-semibold text-[#111827] leading-snug">{product.product_name}</h5>
                                <span className="text-sm font-bold text-[#1a3d6b] ml-3 flex-shrink-0">
                                  {product.monthly_premium?.toLocaleString()}원
                                  <span className="text-[11px] font-normal text-[#9ca3af]">/월</span>
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] mt-2">
                                <div className="flex flex-wrap gap-1">
                                  {product.key_benefits?.slice(0,2).map((b, i) => (
                                    <span key={i} className="bg-[#f5f7fa] text-[#6b7280] px-1.5 py-0.5 rounded">{b}</span>
                                  ))}
                                </div>
                                <span className="bg-[#eef2f8] text-[#1a3d6b] px-2 py-0.5 rounded font-semibold ml-2 flex-shrink-0">
                                  {product.match_score}점
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {viz.type === 'final_report' && (
                      <div className="p-4">
                        <div className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-4">
                          최종 설계안
                        </div>
                        <div className="bg-white border border-[#e4e7ed] rounded-lg p-5 text-center">
                          <div className="text-[11px] text-[#9ca3af] mb-1 uppercase tracking-wide">총 월납 보험료</div>
                          <div className="text-2xl font-bold text-[#1a3d6b] mb-1">
                            {viz.data?.total_premium?.toLocaleString()}원
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {viz.data?.products?.length}개 상품 최적 조합
                          </div>
                          <div className="mt-4 pt-4 border-t border-[#e4e7ed] text-xs text-[#6b7280] leading-relaxed">
                            고객님의 리스크 프로필을 기반으로 한 맞춤형 설계안입니다.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Timestamp */}
              <div className={`text-[10px] text-[#c0c8d4] mt-1.5 ${message.isUser ? 'text-right' : 'text-left ml-0'}`}>
                {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex-shrink-0 w-7 h-7 bg-[#1a3d6b] rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span className="text-white text-[10px] font-bold">KB</span>
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
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="답변을 입력하세요 (Enter 전송 / Shift+Enter 줄바꿈)"
                className="w-full px-4 py-3 border border-[#d1d5db] rounded-lg focus:outline-none focus:border-[#1a3d6b] focus:ring-1 focus:ring-[#1a3d6b] resize-none text-sm text-[#111827] placeholder:text-[#9ca3af] leading-relaxed bg-[#f9fafb] transition-colors"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!currentMessage.trim() || isLoading}
              className="flex-shrink-0 px-5 py-3 bg-[#1a3d6b] hover:bg-[#1e4d87] disabled:bg-[#d1d5db] disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors self-end"
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
