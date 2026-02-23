import { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { brutal, fontFamily } from '@/constants/theme';

interface BrutalInputProps extends Omit<TextInputProps, 'style' | 'onChange'> {
  label?: string;
  error?: string;
  /** Convenience alias for onChangeText */
  onChange?: (text: string) => void;
}

export function BrutalInput({
  label,
  error,
  onChange,
  ...inputProps
}: BrutalInputProps) {
  const [focused, setFocused] = useState(false);

  const shadowColor = error ? brutal.rose : focused ? brutal.accent : brutal.ink;

  return (
    <View style={{ marginBottom: 14 }}>
      {label && (
        <Text
          style={{
            fontSize: brutal.fontSize.sm,
            fontFamily: fontFamily.mono,
            fontWeight: '700',
            color: brutal.inkSoft,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}

      <View style={{ position: 'relative' }}>
        {/* Shadow */}
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
        {/* Input */}
        <TextInput
          {...inputProps}
          onChangeText={onChange ?? inputProps.onChangeText}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          placeholderTextColor="#BBB"
          style={{
            position: 'relative',
            backgroundColor: '#FFFFFF',
            borderWidth: brutal.borderWidth.md,
            borderColor: error ? brutal.rose : brutal.ink,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            fontFamily: fontFamily.body,
            fontWeight: '500',
            color: brutal.ink,
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

