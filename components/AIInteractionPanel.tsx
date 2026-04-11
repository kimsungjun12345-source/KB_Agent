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
  { type: 'age', label: '나이', required: true },
  { type: 'gender', label: '성별', required: true },
  { type: 'job', label: '직업', required: true },
  { type: 'income', label: '소득', required: true },
  { type: 'family', label: '가족 구성', required: false }
];

export default function AIInteractionPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '안녕하세요! KB라이프 보험 설계 도우미입니다. 맞춤형 보험 상품을 추천해드리기 위해 몇 가지 정보가 필요합니다.',
      timestamp: new Date()
    }
  ]);

  const [currentStep, setCurrentStep] = useState<'age' | 'gender' | 'job' | 'income' | 'family' | 'completed'>('age');
  const [userInputs, setUserInputs] = useState<Record<string, any>>({});

  const handleAgeChange = (age: number) => {
    setUserInputs(prev => ({ ...prev, age }));
    addMessage('user', `나이: ${age}세`);
    setTimeout(() => {
      addMessage('ai', '성별을 선택해주세요.');
      setCurrentStep('gender');
    }, 500);
  };

  const handleGenderSelect = (gender: '남성' | '여성') => {
    setUserInputs(prev => ({ ...prev, gender }));
    addMessage('user', `성별: ${gender}`);
    setTimeout(() => {
      addMessage('ai', '직업을 선택해주세요.');
      setCurrentStep('job');
    }, 500);
  };

  const addMessage = (type: 'ai' | 'user', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-xs lg:max-w-md px-4 py-3 rounded-2xl
                ${message.type === 'user'
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
                }
              `}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Structured Input */}
      <div className="border-t border-gray-200 bg-white p-6">
        {currentStep === 'age' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">나이를 선택해주세요</h4>
            <div className="space-y-2">
              <input
                type="range"
                min="20"
                max="70"
                defaultValue="30"
                className="w-full"
                onChange={(e) => {
                  const age = parseInt(e.target.value);
                  document.getElementById('age-display')!.textContent = `${age}세`;
                }}
                onMouseUp={(e) => {
                  const age = parseInt((e.target as HTMLInputElement).value);
                  handleAgeChange(age);
                }}
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>20세</span>
                <span id="age-display" className="font-medium">30세</span>
                <span>70세</span>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'gender' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">성별을 선택해주세요</h4>
            <div className="flex space-x-3">
              <button
                onClick={() => handleGenderSelect('남성')}
                className="flex-1 py-3 px-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                남성
              </button>
              <button
                onClick={() => handleGenderSelect('여성')}
                className="flex-1 py-3 px-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                여성
              </button>
            </div>
          </div>
        )}

        {currentStep === 'job' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">직업을 선택해주세요</h4>
            <select
              className="w-full py-3 px-4 border border-gray-200 rounded-lg focus:border-blue-300 focus:outline-none"
              onChange={(e) => {
                if (e.target.value) {
                  setUserInputs(prev => ({ ...prev, job: e.target.value }));
                  addMessage('user', `직업: ${e.target.value}`);
                  setTimeout(() => {
                    addMessage('ai', '월 소득을 선택해주세요.');
                    setCurrentStep('income');
                  }, 500);
                }
              }}
            >
              <option value="">직업을 선택하세요</option>
              <option value="사무직">사무직</option>
              <option value="전문직">전문직</option>
              <option value="서비스업">서비스업</option>
              <option value="자영업">자영업</option>
              <option value="기타">기타</option>
            </select>
          </div>
        )}

        {currentStep === 'income' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">월 소득을 선택해주세요</h4>
            <div className="grid grid-cols-2 gap-3">
              {['200만원 미만', '200-400만원', '400-600만원', '600-800만원', '800만원 이상'].map((income) => (
                <button
                  key={income}
                  onClick={() => {
                    setUserInputs(prev => ({ ...prev, income }));
                    addMessage('user', `소득: ${income}`);
                    setTimeout(() => {
                      addMessage('ai', '정보 입력이 완료되었습니다. 리스크 분석을 시작하겠습니다.');
                      setCurrentStep('completed');
                    }, 500);
                  }}
                  className="py-3 px-4 text-sm border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                >
                  {income}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'completed' && (
          <div className="text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-green-600 font-semibold">✓</span>
            </div>
            <p className="text-sm text-gray-600">정보 수집이 완료되었습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}