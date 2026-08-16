import React from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export const Alert = ({
  type = 'info',
  title,
  children,
  onClose,
  className = ''
}) => {
  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertCircle,
    error: XCircle
  };

  const styles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    error: 'bg-rose-500/10 border-rose-500/30 text-rose-300'
  };

  const iconColors = {
    info: 'text-blue-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    error: 'text-rose-400'
  };

  const Icon = icons[type] || Info;

  return (
    <div
      role="alert"
      className={clsx(
        'relative flex items-start gap-3 p-4 rounded-xl border transition-all',
        styles[type],
        className
      )}
    >
      <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', iconColors[type])} />
      <div className="flex-1 text-sm">
        {title && <h5 className="font-semibold mb-1 text-white">{title}</h5>}
        <div className="text-slate-300 leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
