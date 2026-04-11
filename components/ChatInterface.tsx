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
      content: `안녕하세요 ${userName}님! 👋 KB라이프 디지털 보험상담실에 오신 것을 환영합니다.\n\n저는 통계청 데이터를 기반으로 한 객관적인 리스크 분석을 통해 ${userName}님에게 가장 적합한 보험 설계를 도와드리는 AI 상담사입니다.\n\n지금부터 총 9단계에 걸쳐 체계적으로 상담을 진행하겠습니다:\n\n🔹 **1-3단계**: 정보 수집 → 리스크 진단 → 보장갭 분석\n🔹 **4-6단계**: 제도 안내 → 상품 추천 → 상세 상담\n🔹 **7-9단계**: 설계 조정 → 최종 확인 → 가입 안내\n\n먼저 **기본 정보 수집**부터 시작하겠습니다. 정확한 분석을 위해 몇 가지 질문드리겠습니다.\n\n**나이와 성별**을 먼저 알려주시겠어요?`,
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        const chunk = decoder.decode(value);
        content += chunk;
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

      const stageMatch = content.match(/###STAGE:(\\d+)###/);
      if (stageMatch) {
        const newStage = parseInt(stageMatch[1]);
        if (newStage !== currentStage) {
          onStageChange(newStage);
        }
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해 주세요.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (content: string) => {
    return content.split('\\n').map((line, index) => {
      if (line.trim() === '') return <br key={index} />;

      if (line.includes('**')) {
        const parts = line.split(/\\*\\*([^*]+)\\*\\*/);
        return (
          <div key={index}>
            {parts.map((part, i) =>
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </div>
        );
      }

      return <div key={index}>{line}</div>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl p-4 rounded-2xl shadow-sm ${
              message.isUser
                ? 'bg-orange-500 text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-900 rounded-tl-sm'
            }`}>
              <div className="prose prose-sm max-w-none">
                {formatMessage(message.content)}
              </div>

              {message.visualizations && message.visualizations.map((viz, index) => (
                <div key={index} className="mt-4 p-4 bg-white rounded-lg border">
                  {viz.type === 'risk_map' && (
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-900">📊 개인별 리스크 프로파일</h4>
                      <div className="space-y-2">
                        {Object.entries(viz.data).map(([risk, score]) => (
                          <div key={risk} className="flex items-center space-x-3">
                            <span className="w-16 text-sm font-medium text-gray-700">{risk}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-green-400 via-yellow-500 to-red-500 h-3 rounded-full"
                                style={{ width: `${(score as number / 10) * 100}%` }}
                              />
                            </div>
                            <span className="w-12 text-sm font-bold text-gray-900">{score}/10</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {viz.type === 'gap_analysis' && (
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-900">🔍 보장갭 분석</h4>
                      <div className="space-y-3">
                        {Object.entries(viz.data).map(([risk, values]) => {
                          const { risk: riskValue, covered } = values as { risk: number; covered: number };
                          const gap = Math.max(0, riskValue - covered);
                          return (
                            <div key={risk} className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-gray-700">{risk}</span>
                                <span className={`text-sm font-semibold ${
                                  gap > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {gap > 0 ? `부족: ${gap}` : '충분'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-2 text-xs opacity-70">
                {message.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <span className="text-gray-500 text-sm ml-2">분석 중...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={2}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!currentMessage.trim() || isLoading}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-medium rounded-lg"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}