import { Modal as RNModal, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-50 dark:bg-slate-900">
        <View className="flex-row items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          {title && (
            <Text className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {title}
            </Text>
          )}
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
        <View className="flex-1">{children}</View>
      </View>
    </RNModal>
  );
}
