import type { CategoryDefinition } from '@/types';

export const CATEGORIES: CategoryDefinition[] = [
  {
    key: 'health',
    label: 'Health',
    labelJa: '健康',
    color: '#10B981',
    icon: 'heart',
  },
  {
    key: 'exercise',
    label: 'Exercise',
    labelJa: '運動',
    color: '#F59E0B',
    icon: 'fitness',
  },
  {
    key: 'learning',
    label: 'Learning',
    labelJa: '学習',
    color: '#6366F1',
    icon: 'book',
  },
  {
    key: 'work',
    label: 'Work',
    labelJa: '仕事',
    color: '#3B82F6',
    icon: 'briefcase',
  },
  {
    key: 'mind',
    label: 'Mind',
    labelJa: 'マインド',
    color: '#8B5CF6',
    icon: 'leaf',
  },
  {
    key: 'other',
    label: 'Other',
    labelJa: 'その他',
    color: '#64748B',
    icon: 'ellipsis-horizontal',
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c])
) as Record<string, CategoryDefinition>;
