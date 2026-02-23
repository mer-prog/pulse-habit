import { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { brutal, fontFamily, useTheme } from '@/constants/theme';

interface BrutalInputProps extends Omit<TextInputProps, 'style' | 'onChange'> {
  label?: string;
  error?: string;
  onChange?: (text: string) => void;
}

export function BrutalInput({ label, error, onChange, ...inputProps }: BrutalInputProps) {
  const [focused, setFocused] = useState(false);
  const { colors, isDark } = useTheme();

  const shadowColor = error ? brutal.rose : focused ? brutal.accent : colors.shadow;

  return (
    <View style={{ marginBottom: 14 }}>
      {label && (
        <Text
          style={{
            fontSize: brutal.fontSize.sm,
            fontFamily: fontFamily.mono,
            fontWeight: '700',
            color: colors.inkSoft,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}

      <View style={{ position: 'relative' }}>
        <View
          style={{
            position: 'absolute',
            top: brutal.shadowOffsetSm,
            left: brutal.shadowOffsetSm,
            right: -brutal.shadowOffsetSm,
            bottom: -brutal.shadowOffsetSm,
            backgroundColor: shadowColor,
          }}
        />
        <TextInput
          {...inputProps}
          onChangeText={onChange ?? inputProps.onChangeText}
          onFocus={(e) => { setFocused(true); inputProps.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); inputProps.onBlur?.(e); }}
          placeholderTextColor={isDark ? '#555' : '#BBB'}
          style={{
            position: 'relative',
            backgroundColor: colors.card,
            borderWidth: brutal.borderWidth.md,
            borderColor: error ? brutal.rose : colors.border,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            fontFamily: fontFamily.body,
            fontWeight: '500',
            color: colors.ink,
          }}
        />
      </View>

      {error && (
        <Text
          style={{
            fontSize: brutal.fontSize.md,
            fontFamily: fontFamily.mono,
            color: brutal.rose,
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
