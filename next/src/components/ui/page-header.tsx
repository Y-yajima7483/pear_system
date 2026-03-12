'use client';

interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export default function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div>
            <h1 className="page-header-title">
              PEAR System
            </h1>
            <p className="page-header-subtitle">
              注文管理システム
            </p>
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
}
