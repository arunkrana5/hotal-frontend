import React, { useState } from 'react';
import { WorkflowInstanceDto } from '@/types/workflow';
import {
  ArrowRight,
  Send,
  MessageSquare,
  ShieldCheck,
  History,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Badge, Card } from '@/components/common/Card';
import { cn } from '@/utils/cn';

export interface WorkflowTrackerProps {
  instance: WorkflowInstanceDto;
  onExecuteAction: (actionName: string, comments?: string) => Promise<void>;
  isLoading?: boolean;
}

export const WorkflowTracker: React.FC<WorkflowTrackerProps> = ({
  instance,
  onExecuteAction,
  isLoading = false,
}) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActionClick = (action: string) => {
    setSelectedAction(action);
  };

  const handleConfirmTransition = async () => {
    if (!selectedAction) return;
    setIsSubmitting(true);
    try {
      await onExecuteAction(selectedAction, comments);
      setSelectedAction(null);
      setComments('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'APPROVED':
      case 'COMPLETED':
        return <Badge variant="success" size="md">Approved / Completed</Badge>;
      case 'REJECTED':
      case 'CANCELLED':
        return <Badge variant="danger" size="md">Rejected</Badge>;
      case 'IN_PROGRESS':
      case 'PENDING':
        return <Badge variant="indigo" size="md">In Progress</Badge>;
      default:
        return <Badge variant="neutral" size="md">{status}</Badge>;
    }
  };

  return (
    <Card className="p-5 space-y-6">
      {/* Workflow Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-border dark:border-navy-700/60 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {instance.workflowTitle}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Target Entity: <span className="font-semibold text-slate-700 dark:text-slate-200">{instance.entityType}</span> (ID: #{instance.entityId}) &bull; Current Stage: <span className="font-bold text-indigo-600 dark:text-indigo-400">{instance.currentStepName}</span>
          </p>
        </div>
        <div>{getStatusBadge(instance.status)}</div>
      </div>

      {/* Available Actions Bar */}
      {instance.availableActions && instance.availableActions.length > 0 && (
        <div className="bg-slate-50 dark:bg-navy-800/60 rounded-xl p-4 border border-border dark:border-navy-700 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Available Transition Actions:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {instance.availableActions.map((action) => {
              const isReject = action.toLowerCase().includes('reject');
              const isApprove = action.toLowerCase().includes('approve');
              return (
                <button
                  key={action}
                  onClick={() => handleActionClick(action)}
                  disabled={isLoading || isSubmitting}
                  className={cn(
                    'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm',
                    selectedAction === action ? 'ring-2 ring-indigo-500' : '',
                    isApprove
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : isReject
                      ? 'bg-rose-600 hover:bg-rose-700 text-white'
                      : 'bg-surface dark:bg-navy-900 text-slate-800 dark:text-slate-200 border border-border dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800'
                  )}
                >
                  {action}
                </button>
              );
            })}
          </div>

          {/* Action execution modal / inline expansion */}
          {selectedAction && (
            <div className="pt-3 border-t border-border dark:border-navy-700/60 space-y-3">
              <div className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Confirm transition action: <strong className="text-indigo-600 dark:text-indigo-400">{selectedAction}</strong></span>
              </div>
              <textarea
                rows={2}
                placeholder="Enter remarks or approval reason (persisted to immutable audit log)..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border dark:border-navy-700 bg-surface dark:bg-navy-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedAction(null);
                    setComments('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmTransition}
                  disabled={isSubmitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  icon={<Send className="w-3 h-3" />}
                >
                  {isSubmitting ? 'Committing...' : 'Commit Step Transition'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workflow Audit Trail / History */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-indigo-500" />
          Transition History &amp; Immutable Audit Trail
        </h4>

        {instance.history && instance.history.length > 0 ? (
          <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900/60 ml-3 space-y-4 py-1">
            {instance.history.map((item) => (
              <div key={item.id} className="relative pl-5 group">
                {/* Dot */}
                <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-surface dark:border-navy-900 shadow-sm" />

                <div className="bg-slate-50 dark:bg-navy-800/40 border border-border dark:border-navy-700/60 rounded-xl p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {item.stepName} &bull; <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{item.actionTaken}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.actionAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Action by User #{item.actionByUserId}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span>
                      {item.previousStatus} &rarr; <strong className="text-slate-700 dark:text-slate-200">{item.newStatus}</strong>
                    </span>
                  </div>

                  {item.comments && (
                    <div className="mt-2 pt-2 border-t border-border dark:border-navy-700/60 text-slate-600 dark:text-slate-300 italic text-[11px]">
                      "{item.comments}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-6 text-center border border-dashed border-border dark:border-navy-700 rounded-xl">
            No history recorded yet for this workflow instance.
          </div>
        )}
      </div>
    </Card>
  );
};
