import React, { useState, useEffect, useRef } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/common/Button';
import { OverlayPortal } from '@/components/common/OverlayPortal';
import { Z_INDEX } from '@/constants/zIndex';
import { notify } from '@/services/notify';

export interface ExportMenuProps {
  onExportCsv?: () => Promise<void> | void;
  onExportExcel?: () => Promise<void> | void;
  onExportPdf?: () => Promise<void> | void;
  title?: string;
  className?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  onExportCsv,
  onExportExcel,
  onExportPdf,
  title = 'Export',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const menuWidth = 180;

    let left = rect.right - menuWidth;
    if (left < 10) left = 10;
    if (left + menuWidth > viewportWidth - 10) {
      left = viewportWidth - menuWidth - 10;
    }

    setDropdownStyle({
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      zIndex: Z_INDEX.DROPDOWN_POPUP,
    });
  };

  const handleToggle = () => {
    if (isExporting) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      const el = document.getElementById('export-menu-dropdown-content');
      if (el && !el.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutside, true);
    return () => window.removeEventListener('mousedown', handleOutside, true);
  }, [isOpen]);

  const executeExport = async (format: 'CSV' | 'Excel' | 'PDF', handler?: () => Promise<void> | void) => {
    setIsOpen(false);
    if (!handler) {
      notify.info(`${format} export is being generated...`);
      return;
    }

    setIsExporting(true);
    const toastId = notify.loading(`Generating ${format} report export...`);

    try {
      await handler();
      notify.dismiss(toastId);
      notify.success(`${format} export generated successfully.`);
    } catch (err: any) {
      notify.dismiss(toastId);
      notify.error(err?.message || `Failed to generate ${format} export`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        disabled={isExporting}
        onClick={handleToggle}
        className={cn(
          'h-8 sm:h-9 px-2.5 text-xs text-brand-muted hover:text-brand-text flex items-center space-x-1.5 shadow-soft-xs',
          isOpen && 'border-brand-primary text-brand-primary dark:text-[#8495FF]'
        )}
        title="Export records in various formats"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline text-xs">{isExporting ? 'Exporting...' : title}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform duration-150', isOpen && 'rotate-180')} />
      </Button>

      {isOpen && (
        <OverlayPortal>
          <div
            id="export-menu-dropdown-content"
            style={dropdownStyle}
            className="rounded-xl border border-brand-border dark:border-brand-darkBorder bg-brand-surface dark:bg-brand-darkSurface shadow-2xl p-1 animate-in fade-in zoom-in-95 duration-150 text-xs text-brand-text"
          >
            <div className="px-2 py-1 text-[10px] uppercase font-bold text-brand-muted tracking-wider border-b border-brand-border/60 dark:border-brand-darkBorder/60 mb-0.5">
              Export Format
            </div>

            {onExportCsv && (
              <button
                type="button"
                onClick={() => executeExport('CSV', onExportCsv)}
                className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-brand-darkSecondary text-left transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-medium">Comma Separated (CSV)</span>
              </button>
            )}

            {onExportExcel && (
              <button
                type="button"
                onClick={() => executeExport('Excel', onExportExcel)}
                className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-brand-darkSecondary text-left transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="font-medium">Microsoft Excel (XLSX)</span>
              </button>
            )}

            {onExportPdf && (
              <button
                type="button"
                onClick={() => executeExport('PDF', onExportPdf)}
                className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-brand-darkSecondary text-left transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span className="font-medium">Adobe PDF Document</span>
              </button>
            )}
          </div>
        </OverlayPortal>
      )}
    </div>
  );
};
