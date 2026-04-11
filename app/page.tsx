'use client';

import { useState } from 'react';
import Header from '../components/Header';
import AIInteractionPanel from '../components/AIInteractionPanel';
import DashboardPanel from '../components/DashboardPanel';

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [dashboardData, setDashboardData] = useState({
    monthlyPremium: 245000,
    coverageRate: 82,
    riskScore: 73
  });

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Fixed Header */}
      <Header
        currentStep={currentStep}
        monthlyPremium={dashboardData.monthlyPremium}
        coverageRate={dashboardData.coverageRate}
        riskScore={dashboardData.riskScore}
      />

      {/* Main Content */}
      <main className="pt-16 h-full">
        {/* Desktop Layout: Side by Side */}
        <div className="hidden lg:flex h-full">
          {/* Left Panel - AI Interaction (45%) */}
          <div className="w-[45%] border-r border-gray-200 flex flex-col">
            <AIInteractionPanel />
          </div>

          {/* Right Panel - Dashboard (55%) */}
          <div className="w-[55%] flex flex-col">
            <DashboardPanel />
          </div>
        </div>

        {/* Mobile Layout: Stacked */}
        <div className="lg:hidden h-full flex flex-col">
          {/* Mobile Tab Navigation */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex space-x-4">
              <button className="flex-1 py-2 px-4 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium">
                대화
              </button>
              <button className="flex-1 py-2 px-4 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">
                분석
              </button>
            </div>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-hidden">
            <AIInteractionPanel />
          </div>
        </div>
      </main>
    </div>
  );
}