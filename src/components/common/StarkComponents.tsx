import React, { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import { useEntryStore } from '../../store/entryStore';

// === STARK BUTTON ===
// Prime Directive: 0px border-radius, interaction inversion, high contrast
interface StarkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  icon?: string;
  fullWidth?: boolean;
}

export const StarkButton: React.FC<StarkButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  fullWidth = false, 
  className = '', 
  onClick,
  disabled,
  ...props 
}) => {
  const baseClasses = "py-4 px-6 font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-150 relative";
  const widthClass = fullWidth ? "w-full" : "";
  
  const { state } = useEntryStore();
  const isEmergency = state?.phase === 'EMERGENCY';

  const variantClasses = {
    primary: isEmergency ? "bg-error text-white border-2 border-error" : "bg-primary text-white border-2 border-primary hover:bg-on-primary-fixed-variant hover:border-on-primary-fixed-variant",
    secondary: isEmergency ? "bg-surface text-error border-2 border-error" : "bg-surface text-primary border-2 border-primary hover:bg-primary-container hover:text-white",
    tertiary: isEmergency ? "bg-transparent text-error" : "bg-transparent text-outline hover:text-on-surface hover:bg-surface-container-low"
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}
      role="button"
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {children}
      {icon && (
        <span
          className="material-symbols-outlined normal-case text-lg"
          style={{ fontVariationSettings: "'FILL' 0" }}
          aria-hidden
        >
          {icon}
        </span>
      )}
    </button>
  );
};

// === STARK INPUT ===
// Prime Directive: Carved slot, no rounded corners, outline-variant base with primary focus
interface StarkInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const StarkInput: React.FC<StarkInputProps> = ({ label, className = '', ...props }) => {
  const inputId = `stark-input-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      <label htmlFor={inputId} className="font-['Inter'] font-bold uppercase tracking-widest text-[10px] text-outline mb-2 block">
        {label}
      </label>
      <input 
        id={inputId}
        aria-label={label}
        className="w-full bg-surface-container-lowest text-on-surface p-4 border-b border-outline-variant focus:outline-none focus:border-b-2 focus:border-primary transition-all placeholder:text-outline-variant text-sm font-bold tracking-wide"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.currentTarget.blur();
          }
          if (props.onKeyDown) props.onKeyDown(e);
        }}
        {...props}
      />
    </div>
  );
};

// === STARK CARD ===
// Prime Directive: Typographical separation, heavy left border instead of boxed shadow.
interface StarkCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StarkCard: React.FC<StarkCardProps> = ({ 
  title, 
  subtitle, 
  children, 
  active = false, 
  onClick, 
  className = '' 
}) => {
  const { state } = useEntryStore();
  const isEmergency = state?.phase === 'EMERGENCY';
  const titleId = React.useId();
  const interactive = Boolean(onClick);

  const borderClass = active 
      ? (isEmergency ? "border-error" : "border-primary-container") 
      : (isEmergency ? "border-error" : "border-outline-variant");
  
  const bgClass = active 
      ? (isEmergency ? "bg-error text-white" : "bg-inverse-surface text-inverse-on-surface")
      : (isEmergency ? "bg-error text-white opacity-80" : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low");
  
  return (
    <div 
      className={`border-2 p-6 transition-all duration-200 ${interactive ? 'cursor-pointer outline-none focus:ring-4 focus:ring-primary' : ''} ${borderClass} ${bgClass} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : 'region'}
      aria-pressed={interactive ? active : undefined}
      aria-labelledby={titleId}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={(e) => {
        if((e.key === 'Enter' || e.key === ' ') && onClick) {
            e.preventDefault();
            onClick();
        }
      }}
    >
      <div className="flex flex-col mb-2">
        <span id={titleId} className="font-black text-sm uppercase tracking-tight">{title}</span>
        {subtitle && <span className={`text-xs ${active ? 'text-inverse-on-surface opacity-80' : 'text-on-surface-variant'}`}>{subtitle}</span>}
      </div>
      <div>
        {children}
      </div>
    </div>
  );
};
