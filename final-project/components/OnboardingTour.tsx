'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import '../styles/OnboardingTour.css';

interface OnboardingStep {
  id: string;
  target?: string; // CSS selector for target element
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlight?: 'none' | 'pulse'; // Special highlight style
  condition?: () => boolean; // Optional condition to show this step
}

interface OnboardingTourProps {
  onComplete: () => void;
  onSkip?: () => void;
  hasGoogleAccount?: boolean;
  onViewChange?: (view: 'month' | 'week' | 'day') => void; // 用于切换视图
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({
  onComplete,
  onSkip,
  hasGoogleAccount = false,
  onViewChange,
}) => {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const [highlightPosition, setHighlightPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 定义所有引导步骤
  const allSteps: OnboardingStep[] = useMemo(() => [
    {
      id: 'welcome',
      title: '歡迎使用自律軌跡！',
      description: '讓我帶你快速了解所有功能，幫助你更有效率地管理時間和行程。\n\n這個導覽大約需要 2-3 分鐘，你可以隨時跳過。',
      position: 'center',
    },
    {
      id: 'view-toggle',
      target: '.view-toggle',
      title: '視圖切換',
      description: '你可以切換三種不同的視圖模式：\n• 月視圖：查看整月事件概覽\n• 週視圖：詳細查看一週的行程安排\n• 日視圖：專注於單日的詳細時間表',
      position: 'bottom',
    },
    {
      id: 'navigation',
      target: '.calendar-nav',
      title: '日期導航',
      description: '使用這些按鈕可以輕鬆切換到上一個或下一個月份/週/日，方便瀏覽不同時期的行程。',
      position: 'bottom',
    },
    {
      id: 'create-event',
      target: '.days-grid .day-cell:not(.other-month)',
      title: '建立事件',
      description: '點擊月曆上的任何日期格子，就可以快速建立新事件。\n\n在週視圖或日視圖中，你也可以點擊時間槽來建立特定時間的事件。',
      position: 'top',
    },
    {
      id: 'sidebar',
      target: '.filter-sidebar',
      title: '側邊欄過濾器',
      description: '側邊欄提供了豐富的過濾和管理功能：\n• 顯示/隱藏課表事件和一次性事件\n• 按分類篩選事件\n• 切換時間格顯示',
      position: 'right',
    },
    {
      id: 'category-manager',
      target: '[data-onboarding="category-manager"]',
      title: '分類管理',
      description: '點擊這裡可以自定義事件分類，包括分類名稱、顏色等。你可以根據自己的需求創建不同的分類，讓事件管理更加有序。',
      position: 'left',
    },
    {
      id: 'ai-assistant',
      target: '[data-onboarding="ai-assistant"]',
      title: 'AI 智能助手',
      description: '使用自然語言輕鬆建立事件！告訴 AI 助手「明天下午3點開會」或「下週一作業要交」，它會自動幫你解析時間和內容並建立事件。',
      position: 'left',
    },
    {
      id: 'time-grid-manager',
      target: '[data-onboarding="time-grid-manager"]',
      title: '時間格管理',
      description: '時間格定義了週視圖和日視圖的時間段劃分。你可以創建自定義的時間格，例如：\n• 學校課表時間（每節課 50 分鐘）\n• 工作時間（9:00-18:00）\n• 自定義時間段\n\n注意：此功能僅在週視圖或日視圖中可用。',
      position: 'left',
    },
    {
      id: 'schedule-manager',
      target: '[data-onboarding="schedule-manager"]',
      title: '課表管理（核心功能）',
      description: '這是我們的核心差異化功能！課表管理讓你輕鬆管理重複的課程或活動：\n\n✨ 創建課表：為不同學期或時期創建獨立的課表\n📝 編輯課表：在課表編輯器中點擊格子添加課程\n🔄 激活課表：設定日期範圍，自動生成重複的課程事件\n⏸️ 停用課表：隨時停止生成重複事件\n\n課表事件會作為背景層顯示，與一次性事件區分開來。',
      position: 'left',
      highlight: 'pulse',
    },
    {
      id: 'google-sync',
      target: '[data-onboarding="google-sync"]',
      title: 'Google Calendar 同步',
      description: '如果你使用 Google 帳號登入，可以點擊這裡同步 Google Calendar 中的事件，讓所有行程集中在一個地方管理。',
      position: 'left',
      condition: () => hasGoogleAccount,
    },
    {
      id: 'diary',
      target: '.diary-add-button',
      title: '日記和心情記錄',
      description: '點擊日期旁邊的日記按鈕，可以記錄當天的心情和想法。日記會顯示在月曆上，讓你在回顧時更容易回憶起當天的感受。',
      position: 'top',
    },
    {
      id: 'theme',
      target: '[data-onboarding="theme-toggle"]',
      title: '主題切換',
      description: '點擊這裡可以切換不同的視覺主題，包括現代簡約、商務藍金、夢幻粉藍、可愛童趣、手帳拼貼等多種風格，選擇最符合你喜好的主題。',
      position: 'left',
    },
    {
      id: 'share',
      target: '[data-onboarding="share-button"]',
      title: '分享日曆',
      description: '你可以將日曆分享給他人，或導出為圖片、PDF 格式。分享時可以選擇分享的範圍（單月、日期範圍或全部）、內容詳細程度等。',
      position: 'left',
    },
    {
      id: 'complete',
      title: '導覽完成！',
      description: '你已經了解了所有主要功能！\n\n現在你可以開始使用自律軌跡來管理你的行程、課表和事件了。如果在使用過程中遇到問題，隨時可以查看幫助文檔或聯繫我們。\n\n祝使用愉快！🎉',
      position: 'center',
    },
  ], [hasGoogleAccount]);

  // 過濾步驟（根據條件）
  const steps = useMemo(() => {
    return allSteps.filter(step => {
      if (step.condition && !step.condition()) {
        return false;
      }
      return true;
    });
  }, [allSteps]);

  const currentStepData = steps[currentStep];

  // 處理需要特定視圖的步驟（例如時間格管理需要在 week/day 視圖，日記需要在月視圖）
  useEffect(() => {
    if (!currentStepData || !onViewChange) return;

    // 時間格管理步驟需要在 week 或 day 視圖
    if (currentStepData.id === 'time-grid-manager') {
      // 檢查當前視圖
      const viewToggle = document.querySelector('.view-toggle');
      if (viewToggle) {
        const weekButton = viewToggle.querySelector('button:nth-child(2)') as HTMLElement;
        const dayButton = viewToggle.querySelector('button:nth-child(3)') as HTMLElement;
        const weekButtonActive = weekButton?.classList.contains('active');
        const dayButtonActive = dayButton?.classList.contains('active');
        
        // 如果不在 week 或 day 視圖，切換到 week 視圖
        if (!weekButtonActive && !dayButtonActive) {
          onViewChange('week');
        }
      }
    }

    // 日記步驟需要在月視圖
    if (currentStepData.id === 'diary') {
      // 檢查當前視圖
      const viewToggle = document.querySelector('.view-toggle');
      if (viewToggle) {
        const monthButton = viewToggle.querySelector('button:nth-child(1)') as HTMLElement;
        const monthButtonActive = monthButton?.classList.contains('active');
        
        // 如果不在月視圖，切換到月視圖
        if (!monthButtonActive) {
          onViewChange('month');
        }
      }
    }
  }, [currentStep, currentStepData, onViewChange]);

  // 計算目標元素位置
  useEffect(() => {
    if (!currentStepData?.target || currentStepData.position === 'center') {
      setTargetElement(null);
      setTooltipPosition(null);
      return;
    }

    // 對於需要特定視圖的步驟，需要等待視圖切換完成
    const findAndProcessElement = () => {
      // TypeScript guard: we already checked target exists above
      if (!currentStepData.target) return;
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (!element) {
        // 對於時間格管理步驟，如果元素不存在，再等一段時間
        if (currentStepData.id === 'time-grid-manager') {
          setTimeout(findAndProcessElement, 200);
          return;
        }
        console.warn(`Target element not found: ${currentStepData.target}`);
        setTargetElement(null);
        setTooltipPosition(null);
        setHighlightPosition(null);
        return;
      }

      // 元素找到，處理位置計算
      processElementLocation(element);
    };

    const processElementLocation = (element: HTMLElement) => {
      setTargetElement(element);

      // 計算工具提示位置（使用 getBoundingClientRect 获取相对于视窗的位置）
      const rect = element.getBoundingClientRect();
      
      // 工具提示的近似尺寸
      const tooltipWidth = 400;
      const tooltipHeight = 300;
      const padding = 20;
      const margin = 10; // 距离屏幕边缘的最小距离
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 使用相对于视窗的坐标（getBoundingClientRect 已经返回相对于视窗的位置）
      let top = 0;
      let left = 0;
      let finalPosition = currentStepData.position || 'bottom';
      
      switch (currentStepData.position) {
        case 'top':
          top = rect.top - padding;
          left = rect.left + rect.width / 2;
          // 检查是否会超出顶部
          if (top - tooltipHeight < margin) {
            // 如果超出顶部，改为显示在底部
            top = rect.bottom + padding;
            finalPosition = 'bottom';
          }
          break;
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2;
          // 检查是否会超出底部
          if (top + tooltipHeight > viewportHeight - margin) {
            // 如果超出底部，改为显示在顶部
            top = rect.top - padding;
            finalPosition = 'top';
          }
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - tooltipWidth / 2 - padding;
          // 检查是否会超出左侧
          if (left < margin) {
            // 如果超出左侧，改为显示在右侧
            left = rect.right + tooltipWidth / 2 + padding;
            finalPosition = 'right';
          }
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + tooltipWidth / 2 + padding;
          // 检查是否会超出右侧
          if (left + tooltipWidth / 2 > viewportWidth - margin) {
            // 如果超出右侧，改为显示在左侧
            left = rect.left - tooltipWidth / 2 - padding;
            finalPosition = 'left';
          }
          break;
      }

      // 确保水平方向不超出视窗（使用相对于视窗的坐标）
      const leftBound = margin;
      const rightBound = viewportWidth - margin;
      if (left - tooltipWidth / 2 < leftBound) {
        left = leftBound + tooltipWidth / 2;
      }
      if (left + tooltipWidth / 2 > rightBound) {
        left = rightBound - tooltipWidth / 2;
      }

      // 确保垂直方向不超出视窗
      const topBound = margin;
      const bottomBound = viewportHeight - margin;
      if (top < topBound) {
        top = topBound;
      }
      if (top + tooltipHeight > bottomBound) {
        top = bottomBound - tooltipHeight;
      }

      setTooltipPosition({ top, left });

      // 同時更新高亮區域位置
      const highlightRect = element.getBoundingClientRect();
      setHighlightPosition({
        top: highlightRect.top,
        left: highlightRect.left,
        width: highlightRect.width,
        height: highlightRect.height,
      });
    };

    // 對於需要視圖切換的步驟，稍微延遲以確保視圖已切換
    if (currentStepData.id === 'time-grid-manager' || currentStepData.id === 'diary') {
      setTimeout(findAndProcessElement, 300);
    } else {
      findAndProcessElement();
    }
  }, [currentStep, currentStepData]);

  // 處理窗口大小變化和滾動
  useEffect(() => {
    if (!targetElement || !currentStepData?.target || currentStepData.position === 'center') {
      return;
    }

    const handleResizeOrScroll = () => {
      const rect = targetElement.getBoundingClientRect();
      const tooltipWidth = 400;
      const tooltipHeight = 300;
      const padding = 20;
      const margin = 10;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;
      let finalPosition = currentStepData.position || 'bottom';

      switch (currentStepData.position) {
        case 'top':
          top = rect.top - padding;
          left = rect.left + rect.width / 2;
          if (top - tooltipHeight < margin) {
            top = rect.bottom + padding;
            finalPosition = 'bottom';
          }
          break;
        case 'bottom':
          top = rect.bottom + padding;
          left = rect.left + rect.width / 2;
          if (top + tooltipHeight > viewportHeight - margin) {
            top = rect.top - padding;
            finalPosition = 'top';
          }
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - tooltipWidth / 2 - padding;
          if (left < margin) {
            left = rect.right + tooltipWidth / 2 + padding;
            finalPosition = 'right';
          }
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + tooltipWidth / 2 + padding;
          if (left + tooltipWidth / 2 > viewportWidth - margin) {
            left = rect.left - tooltipWidth / 2 - padding;
            finalPosition = 'left';
          }
          break;
      }

      // 確保水平方向不超出視窗
      const leftBound = margin;
      const rightBound = viewportWidth - margin;
      if (left - tooltipWidth / 2 < leftBound) {
        left = leftBound + tooltipWidth / 2;
      }
      if (left + tooltipWidth / 2 > rightBound) {
        left = rightBound - tooltipWidth / 2;
      }

      // 確保垂直方向不超出視窗
      const topBound = margin;
      const bottomBound = viewportHeight - margin;
      if (top < topBound) {
        top = topBound;
      }
      if (top + tooltipHeight > bottomBound) {
        top = bottomBound - tooltipHeight;
      }

      setTooltipPosition({ top, left });

      // 同時更新高亮區域位置
      if (targetElement) {
        const highlightRect = targetElement.getBoundingClientRect();
        setHighlightPosition({
          top: highlightRect.top,
          left: highlightRect.left,
          width: highlightRect.width,
          height: highlightRect.height,
        });
      }
    };

    // 初始計算一次
    handleResizeOrScroll();

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll);
    };
  }, [currentStepData, targetElement]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
      });
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete(); // Still complete even if API call fails
    }
  };

  if (!currentStepData) {
    return null;
  }

  const isCenterStep = currentStepData.position === 'center' || !currentStepData.target;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="onboarding-tour">
      {/* 覆蓋層 */}
      <div
        ref={overlayRef}
        className={`onboarding-overlay ${isCenterStep ? 'center-mode' : ''}`}
        onClick={(e) => {
          // 阻止點擊穿透，但允許點擊下一步按鈕
          e.stopPropagation();
        }}
      >
        {/* 高亮區域（非居中步驟） */}
        {!isCenterStep && highlightPosition && (
          <div
            className={`onboarding-highlight ${currentStepData.highlight === 'pulse' ? 'pulse' : ''}`}
            style={{
              position: 'fixed',
              top: highlightPosition.top,
              left: highlightPosition.left,
              width: highlightPosition.width,
              height: highlightPosition.height,
              zIndex: 10001,
            }}
          />
        )}
      </div>

      {/* 工具提示 */}
      <div
        ref={tooltipRef}
        className={`onboarding-tooltip ${isCenterStep ? 'center-tooltip' : ''} ${currentStepData.position || 'bottom'}`}
        style={
          isCenterStep
            ? {}
            : tooltipPosition
            ? {
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: 'translate(-50%, 0)',
                zIndex: 10002,
              }
            : { display: 'none' }
        }
      >
        <div className="onboarding-tooltip-content">
          <div className="onboarding-progress">
            步驟 {currentStep + 1} / {steps.length}
          </div>
          <h3 className="onboarding-tooltip-title">{currentStepData.title}</h3>
          <div className="onboarding-tooltip-description">
            {currentStepData.description.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < currentStepData.description.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
          <div className="onboarding-tooltip-actions">
            {!isFirstStep && (
              <button className="onboarding-btn onboarding-btn-secondary" onClick={handlePrev}>
                上一步
              </button>
            )}
            <button className="onboarding-btn onboarding-btn-skip" onClick={handleSkip}>
              跳過
            </button>
            <button className="onboarding-btn onboarding-btn-primary" onClick={handleNext}>
              {isLastStep ? '完成' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;

