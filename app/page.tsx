'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import ProgressSidebar from '@/components/ProgressSidebar';
import WelcomeScreen from '@/components/WelcomeScreen';

export default function HomePage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [userName, setUserName] = useState('');

  if (!hasStarted) {
    return (
      <WelcomeScreen
        onStart={(name: string) => {
          setUserName(name);
          setHasStarted(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* KB라이프 헤더 */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">KB</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">디지털 보험상담실</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">안녕하세요, {userName}님</span>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-500">1588-9922</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* 진행 상황 사이드바 */}
        <ProgressSidebar currentStage={currentStage} />

        {/* 메인 채팅 영역 */}
        <div className="flex-1 flex flex-col">
          <ChatInterface
            userName={userName}
            currentStage={currentStage}
            onStageChange={setCurrentStage}
          />
        </div>
      </div>
    </div>
  );
}