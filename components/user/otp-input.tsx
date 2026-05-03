import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { ThemedText } from '../themed-text';
import { Colors, normalize, Shadows } from '@/constants/theme';

interface OtpInputProps {
  code: string;
  setCode: (code: string) => void;
  length?: number;
}

export const OtpInput: React.FC<OtpInputProps> = ({ code, setCode, length = 6 }) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const renderDigit = (index: number) => {
    const digit = code[index] || '';
    const isCurrent = index === code.length && isFocused;
    const isFilled = index < code.length;

    return (
      <View key={index} style={styles.digitWrapper}>
        <View
          style={[
            styles.digitBox,
            isCurrent && styles.activeDigitBox,
            isFilled && styles.filledDigitBox,
          ]}
        >
          {digit ? (
            <ThemedText style={styles.digitText}>{digit}</ThemedText>
          ) : (
            <View style={styles.placeholderDot} />
          )}
          
          {isCurrent && <View style={styles.activeIndicator} />}
        </View>
        
        {/* Split separator after 3rd digit */}
        {index === 2 && <View style={styles.separator} />}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        style={styles.otpContainer}
      >
        {Array.from({ length }).map((_, i) => renderDigit(i))}
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={(text) => {
          if (text.length <= length) {
            setCode(text.replace(/[^0-9]/g, ''));
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        style={styles.hiddenInput}
        maxLength={length}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 15,
  },
  otpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  digitWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digitBox: {
    width: normalize.width(42),
    height: normalize.height(52),
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Shadows.small,
    shadowOpacity: 0.05,
  },
  activeDigitBox: {
    borderColor: '#0061FE',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
    ...Shadows.medium,
    shadowColor: '#0061FE',
    shadowOpacity: 0.15,
  },
  filledDigitBox: {
    borderColor: '#0061FE',
    backgroundColor: '#FFFFFF',
  },
  digitText: {
    fontSize: 22,
    fontFamily: 'Alexandria-Bold',
    color: '#1E293B',
  },
  placeholderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 12,
    height: 2,
    backgroundColor: '#0061FE',
    borderRadius: 1,
  },
  separator: {
    width: 12,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});

