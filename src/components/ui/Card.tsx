import { View } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <View
      className={`rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-800 ${className}`}
    >
      {children}
    </View>
  );
}
