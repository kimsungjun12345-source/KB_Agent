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
    <div className="min-h-screen bg-[#f5f7fa]">
      {/* App header */}
      <header className="h-14 bg-white border-b border-[#e4e7ed] flex items-center px-5 lg:px-7 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="w-7 h-7 bg-[#1a3d6b] rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs tracking-tight">KB</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-[#111827]">KB라이프</span>
            <span className="hidden sm:inline text-[#d1d5db]">·</span>
            <span className="hidden sm:inline text-sm text-[#6b7280]">보험 설계 시스템</span>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center space-x-5 text-xs">
          <span className="text-[#9ca3af] hidden sm:block">
            {userName}님의 진단
          </span>
          <div className="h-4 w-px bg-[#e4e7ed] hidden sm:block" />
          <span className="text-[#9ca3af]">1588-9922</span>
          {/* Mobile stage pill */}
          <div className="lg:hidden flex items-center space-x-2">
            <div className="h-3.5 w-px bg-[#e4e7ed]" />
            <span className="text-[#6b7280] font-medium">{currentStage}/9</span>
          </div>
        </div>
      </header>

      {/* Mobile progress bar */}
      <div className="lg:hidden fixed top-14 left-0 right-0 z-40 bg-white border-b border-[#e4e7ed]">
        <div
          className="h-[2px] bg-[#1a3d6b] transition-all duration-500"
          style={{ width: `${(currentStage / 9) * 100}%` }}
        />
      </div>

      {/* Body layout */}
      <div className="flex h-screen pt-14">
        {/* Sidebar — desktop only */}
        <div className="hidden lg:block flex-shrink-0">
          <ProgressSidebar currentStage={currentStage} />
        </div>

        {/* Main chat */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
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
