'use client';

import { useState } from 'react';

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

interface StructuredInput {
  type: 'age' | 'gender' | 'job' | 'income' | 'family';
  label: string;
  required: boolean;
}

const structuredInputs: StructuredInput[] = [
  { type: 'age',    label: '나이',     required: true },
  { type: 'gender', label: '성별',     required: true },
  { type: 'job',    label: '직업',     required: true },
  { type: 'income', label: '소득',     required: true },
  { type: 'family', label: '가족 구성', required: false }
];

export default function AIInteractionPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: 'KB라이프 보험 설계 시스템입니다. 맞춤형 설계를 위해 몇 가지 정보를 수집하겠습니다.',
      timestamp: new Date()
    }
  ]);

  const [currentStep, setCurrentStep] = useState<'age' | 'gender' | 'job' | 'income' | 'family' | 'completed'>('age');
  const [userInputs, setUserInputs] = useState<Record<string, any>>({});

  const addMessage = (type: 'ai' | 'user', content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }]);
  };

  const handleAgeChange = (age: number) => {
    setUserInputs(prev => ({ ...prev, age }));
    addMessage('user', `나이: ${age}세`);
    setTimeout(() => {
      addMessage('ai', '성별을 선택해 주세요.');
      setCurrentStep('gender');
    }, 500);
  };

  const handleGenderSelect = (gender: '남성' | '여성') => {
    setUserInputs(prev => ({ ...prev, gender }));
    addMessage('user', `성별: ${gender}`);
    setTimeout(() => {
      addMessage('ai', '직업을 선택해 주세요.');
      setCurrentStep('job');
    }, 500);
  };

  return (
    <div className="h-full flex flex-col bg-[#f5f7fa]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.type === 'ai' && (
              <div className="flex-shrink-0 w-6 h-6 bg-[#1a3d6b] rounded-full flex items-center justify-center mr-2.5 mt-0.5">
                <span className="text-white text-[9px] font-bold">KB</span>
              </div>
            )}
            <div className={`max-w-xs px-4 py-3 rounded-xl text-sm leading-relaxed ${
              message.type === 'user'
                ? 'bg-[#1a3d6b] text-white rounded-br-sm'
                : 'bg-white text-[#1f2937] border border-[#e4e7ed] rounded-tl-sm'
            }`}>
              <p>{message.content}</p>
              <div className="text-[10px] opacity-50 mt-1.5">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Structured Input */}
      <div className="border-t border-[#e4e7ed] bg-white px-5 py-5">

        {currentStep === 'age' && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-[#374151]">나이를 선택해 주세요</div>
            <div className="space-y-2.5">
              <input
                type="range"
                min="20"
                max="70"
                defaultValue="30"
                className="fintech-slider"
                onChange={(e) => {
                  const age = parseInt(e.target.value);
                  const el = document.getElementById('age-display');
                  if (el) el.textContent = `${age}세`;
                }}
                onMouseUp={(e) => handleAgeChange(parseInt((e.target as HTMLInputElement).value))}
              />
              <div className="flex justify-between text-xs text-[#9ca3af]">
                <span>20세</span>
                <span id="age-display" className="font-semibold text-[#374151]">30세</span>
                <span>70세</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'gender' && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-[#374151]">성별을 선택해 주세요</div>
            <div className="flex space-x-3">
              {(['남성', '여성'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => handleGenderSelect(g)}
                  className="flex-1 py-2.5 text-sm font-medium border border-[#d1d5db] rounded-lg text-[#374151] hover:border-[#1a3d6b] hover:bg-[#eef2f8] hover:text-[#1a3d6b] transition-colors"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'job' && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-[#374151]">직업을 선택해 주세요</div>
            <select
              className="input-field"
              onChange={(e) => {
                if (e.target.value) {
                  setUserInputs(prev => ({ ...prev, job: e.target.value }));
                  addMessage('user', `직업: ${e.target.value}`);
                  setTimeout(() => {
                    addMessage('ai', '월 소득을 선택해 주세요.');
                    setCurrentStep('income');
                  }, 500);
                }
              }}
            >
              <option value="">직업 선택</option>
              <option value="사무직">사무직</option>
              <option value="전문직">전문직</option>
              <option value="서비스업">서비스업</option>
              <option value="자영업">자영업</option>
              <option value="기타">기타</option>
            </select>
          </div>
        )}

        {currentStep === 'income' && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-[#374151]">월 소득을 선택해 주세요</div>
            <div className="grid grid-cols-2 gap-2">
              {['200만원 미만', '200–400만원', '400–600만원', '600–800만원', '800만원 이상'].map((income) => (
                <button
                  key={income}
                  onClick={() => {
                    setUserInputs(prev => ({ ...prev, income }));
                    addMessage('user', `소득: ${income}`);
                    setTimeout(() => {
                      addMessage('ai', '정보 입력이 완료되었습니다. 리스크 분석을 시작합니다.');
                      setCurrentStep('completed');
                    }, 500);
                  }}
                  className="py-2.5 px-3 text-xs font-medium border border-[#d1d5db] rounded-lg text-[#374151] hover:border-[#1a3d6b] hover:bg-[#eef2f8] hover:text-[#1a3d6b] transition-colors text-center"
                >
                  {income}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'completed' && (
          <div className="text-center py-4 space-y-2">
            <div className="w-10 h-10 bg-[#ecfdf5] border border-[#d1fae5] rounded-full flex items-center justify-center mx-auto">
              <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
                <path d="M1 7L5.5 11.5L15 1" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm text-[#374151] font-medium">정보 수집 완료</p>
            <p className="text-xs text-[#9ca3af]">리스크 분석을 진행합니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
