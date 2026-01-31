'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MENU_ITEMS } from '@/config/menu';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // クライアントサイドでのマウント確認
  useEffect(() => {
    setMounted(true);
  }, []);

  // デバイス判定
  useEffect(() => {
    if (!mounted) return;

    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1280);
      // PCでは常時展開
      if (width >= 1280) {
        setIsExpanded(true);
      } else {
        setIsExpanded(false);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, [mounted]);

  // スワイプ操作
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;

    // 左スワイプで閉じる
    if (diff < -50 && isMobileOpen) {
      setIsMobileOpen(false);
    }
    // 右スワイプで開く（画面左端から開始した場合）
    if (diff > 50 && touchStartX < 30 && !isMobileOpen) {
      setIsMobileOpen(true);
    }

    setTouchStartX(null);
  }, [touchStartX, isMobileOpen]);

  // エスケープキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  // ルート変更時にモバイルメニューを閉じる
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // アクティブ判定
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  // タブレット/モバイル用のサイドバー
  const renderMobileSidebar = () => (
    <>
      {/* ハンバーガーボタン */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="sidebar-mobile-trigger"
        aria-label="メニューを開く"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* オーバーレイ */}
      {isMobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
      )}

      {/* サイドバー本体 */}
      <aside
        className={`sidebar-mobile ${isMobileOpen ? 'open' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="sidebar-mobile-header">
          <div className="flex items-center gap-3">
            <div className="pear-logo-small">
              <span className="text-sm">🍐</span>
            </div>
            <span className="text-base font-semibold pear-text-gradient">PEAR System</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="sidebar-close-btn"
            aria-label="メニューを閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`sidebar-nav-item ${active ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );

  // PC・タブレット用のサイドバー
  const renderDesktopSidebar = () => (
    <aside
      className={`sidebar-desktop ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}
    >
      {/* ヘッダー */}
      <div className="sidebar-desktop-header">
        {isExpanded ? (
          <div className="flex items-center gap-3">
            <div className="pear-logo-small">
              <span className="text-sm">🍐</span>
            </div>
            <span className="text-base font-semibold pear-text-gradient whitespace-nowrap">PEAR System</span>
          </div>
        ) : (
          <div className="pear-logo-small mx-auto">
            <span className="text-sm">🍐</span>
          </div>
        )}

        {/* タブレットでは折りたたみボタンを表示 */}
        {isTablet && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="sidebar-toggle-desktop"
            aria-label={isExpanded ? 'メニューを折りたたむ' : 'メニューを展開'}
          >
            {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* ナビゲーション */}
      <nav className="sidebar-nav">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`sidebar-nav-item ${active ? 'active' : ''} ${!isExpanded ? 'collapsed' : ''}`}
              title={!isExpanded ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );

  // 初期レンダリング前は何も表示しない
  if (!mounted) {
    return null;
  }

  // モバイルではモバイル版のみ
  if (isMobile) {
    return renderMobileSidebar();
  }

  // タブレット・PCではデスクトップ版
  return renderDesktopSidebar();
}
