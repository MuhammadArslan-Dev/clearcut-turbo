'use client';
import React from 'react';
import Text from '@clearcut/ui/text';
import StatusChip from '@/components/ui/cards/preparation/chapter-list/StatusChip';
import { Clock, FileText, HelpCircle, MinusCircle } from 'lucide-react';

export interface ExamInstance {
  id: number;
  uuid: string;
  instance_id: string;
  exam_year: number | null;
  exam_cycle: string | null;
  mode: 'Online' | 'Offline' | 'Hybrid' | null;
  duration_minutes: number | null;
  total_marks: number | null;
  total_questions: number | null;
  negative_marking: boolean | null;
  pass_criteria: string | null;
  pass_marks: any;
  marking_scheme: any;
}

const modeTone = (mode: ExamInstance['mode']) => {
  if (mode === 'Online') return 'info' as const;
  if (mode === 'Offline') return 'neutral' as const;
  return 'warning' as const;
};

interface ExamInstanceCardProps {
  instance: ExamInstance;
  onClick?: (instance: ExamInstance) => void;
}

export default function ExamInstanceCard({ instance, onClick }: ExamInstanceCardProps) {
  const stats = [
    {
      icon: <Clock size={14} className="text-blue-500" />,
      label: 'Duration',
      value: instance.duration_minutes ? `${instance.duration_minutes} min` : '—',
    },
    {
      icon: <FileText size={14} className="text-green-500" />,
      label: 'Total Marks',
      value: instance.total_marks ?? '—',
    },
    {
      icon: <HelpCircle size={14} className="text-purple-500" />,
      label: 'Questions',
      value: instance.total_questions ?? '—',
    },
  ];

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 shadow-sm cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
      onClick={() => onClick?.(instance)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <Text as="h6" variant="body-medium" weight="semibold" color="gray-subtle">
            {instance.exam_cycle ?? instance.instance_id}
          </Text>
          {instance.exam_year && (
            <Text as="p" variant="body-small" color="gray-muted">
              Year: {instance.exam_year}
            </Text>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {instance.mode && (
            <StatusChip
              label={instance.mode}
              variant="soft"
              tone={modeTone(instance.mode)}
              size="sm"
            />
          )}
          {instance.negative_marking && (
            <StatusChip
              label="Negative"
              variant="soft"
              tone="error"
              size="sm"
              iconLeft={<MinusCircle size={12} />}
            />
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center bg-gray-50 rounded-lg py-2 px-1 gap-1"
          >
            <div className="flex items-center gap-1">
              {stat.icon}
              <Text as="p" variant="body-small" color="gray-muted">
                {stat.label}
              </Text>
            </div>
            <Text as="p" variant="body-medium" weight="bold" color="gray-subtle">
              {String(stat.value)}
            </Text>
          </div>
        ))}
      </div>

      {/* Pass criteria */}
      {instance.pass_criteria && (
        <div className="border-t border-gray-100 pt-2">
          <Text as="p" variant="body-small" color="gray-muted">
            Pass Criteria:{' '}
            <Text variant="body-small" weight="semibold">
              {instance.pass_criteria}
            </Text>
          </Text>
        </div>
      )}
    </div>
  );
}
