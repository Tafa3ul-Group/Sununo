import LottieView, { LottieViewProps } from 'lottie-react-native';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';

const MOTIONS = {
  loading: require('./motions/loading.json'),
  success: require('./motions/success.json'),
  failed: require('./motions/fail.json'),
  splash: require('./motions/splash.json'),
};

export type MotionName = keyof typeof MOTIONS;

interface MotionIconProps extends Omit<LottieViewProps, 'source'> {
  name: MotionName;
  size?: number;
}

export const MotionIcon = forwardRef(({ name, size = 100, style, ...props }: MotionIconProps, ref) => {
  const lottieRef = useRef<LottieView>(null);

  useImperativeHandle(ref, () => ({
    play: () => lottieRef.current?.play(),
    reset: () => lottieRef.current?.reset(),
    pause: () => lottieRef.current?.pause(),
    resume: () => lottieRef.current?.resume(),
  }));

  return (
    <LottieView
      ref={lottieRef}
      source={MOTIONS[name]}
      autoPlay={props.autoPlay ?? true}
      loop={props.loop ?? true}
      style={[
        { width: size, height: size },
        style,
      ]}
      {...props}
    />
  );
});

MotionIcon.displayName = 'MotionIcon';
