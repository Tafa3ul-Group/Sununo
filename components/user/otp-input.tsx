import React, { useImperativeHandle, useRef, useState } from 'react';
import {
  Keyboard,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Animated } from 'react-native';
import { ThemedText } from '../themed-text';
import { Colors, normalize } from '@/constants/theme';

interface OtpInputProps {
  code: string;
  setCode: (code: string) => void;
  length?: number;
  /**
   * Fired the moment the last digit lands — typed, pasted, or filled in from the
   * SMS autofill suggestion — so the screen can submit without a button tap.
   * Only user input triggers it; programmatic `setCode` (e.g. the dev-mode OTP
   * echoed back by the API) deliberately does not.
   */
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
}

/** Lets a screen put the caret back after a rejected code. */
export interface OtpInputHandle {
  focus: () => void;
}

export const OtpInput = React.forwardRef<OtpInputHandle, OtpInputProps>(({
  code,
  setCode,
  length = 6,
  onComplete,
  autoFocus = false,
}, ref) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }), []);

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
          const digits = text.replace(/[^0-9]/g, '').slice(0, length);
          setCode(digits);
          if (digits.length === length) {
            Keyboard.dismiss();
            onComplete?.(digits);
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        style={styles.hiddenInput}
        maxLength={length}
      />
    </View>
  );
});

OtpInput.displayName = 'OtpInput';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    direction: 'ltr',
    marginVertical: 15 },
  otpContainer: {
    flexDirection: 'row',
    // OTP digits are always read left-to-right; force LTR so they don't get
    // reversed when the app content direction is RTL (Arabic).
    direction: 'ltr',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8 },
  digitWrapper: {
    flexDirection: 'row',
    direction: 'ltr',
    alignItems: 'center' },
  digitBox: {
    width: normalize.width(42),
    height: normalize.height(52),
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' },
  activeDigitBox: {
    borderColor: '#0061FE',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    transform: [{ scale: 1.05 }] },
  filledDigitBox: {
    borderColor: '#0061FE',
    backgroundColor: '#FFFFFF' },
  digitText: {
    fontSize: 14,
    fontFamily: "IBMPlexSansArabic-Medium",
    color: '#1E293B' },
  placeholderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1' },
  activeIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 12,
    height: 2,
    backgroundColor: '#0061FE',
    borderRadius: 1 },
  separator: {
    width: 12,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    borderRadius: 1 },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0 } });

