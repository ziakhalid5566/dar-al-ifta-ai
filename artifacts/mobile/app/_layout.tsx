import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider } from '@/context/AppContext';

// ── Global crash visibility ───────────────────────────────────────────────────
// Catches any JS exception that escapes React's error boundary (e.g. native
// module init errors, module-level throws) and logs it clearly so that a
// frozen-splash-screen crash is immediately diagnosable in device logs /
// Metro / Logcat without guessing.
if (typeof ErrorUtils !== 'undefined') {
  const _prevGlobalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.error(
      `[Dar Al-Ifta ${isFatal ? 'FATAL' : 'ERROR'}]`,
      error?.message ?? String(error),
      '\nStack:', error?.stack ?? '(no stack)',
    );
    // Always call the previous handler so React Native's default behaviour
    // (red screen in dev, crash in production) is preserved.
    _prevGlobalHandler(error, isFatal);
  });
}
// ─────────────────────────────────────────────────────────────────────────────

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// ── Loading Screen ────────────────────────────────────────────────────────────

function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [percent, setPercent] = useState(0);
  const barWidth = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(1)).current;
  const completeCalled = useRef(false);

  // Fade-in logo on mount
  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  // Sparkle pulse on the icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle, { toValue: 1.25, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sparkle, { toValue: 1.0,  duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Progress: simulate realistic loading curve over 3 seconds
  useEffect(() => {
    const steps: Array<{ target: number; delay: number }> = [
      { target: 15,  delay: 150 },
      { target: 30,  delay: 250 },
      { target: 45,  delay: 200 },
      { target: 60,  delay: 300 },
      { target: 72,  delay: 200 },
      { target: 82,  delay: 250 },
      { target: 90,  delay: 200 },
      { target: 95,  delay: 300 },
      { target: 98,  delay: 400 },
      { target: 100, delay: 300 },
    ];

    let cancelled = false;
    let current = 0;

    const runStep = async (idx: number) => {
      if (cancelled || idx >= steps.length) return;
      const { target, delay } = steps[idx];

      // Animate percent counter
      const start = current;
      const diff = target - start;
      const stepDelay = delay / diff;

      for (let v = start + 1; v <= target; v++) {
        if (cancelled) return;
        await new Promise<void>((r) => setTimeout(r, stepDelay));
        setPercent(v);
        current = v;
      }

      // Animate bar width
      Animated.timing(barWidth, {
        toValue: target,
        duration: delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start();

      if (target === 100) {
        // Short pause at 100% then call complete
        setTimeout(() => {
          if (!completeCalled.current) {
            completeCalled.current = true;
            onComplete();
          }
        }, 400);
      } else {
        await new Promise<void>((r) => setTimeout(r, delay));
        runStep(idx + 1);
      }
    };

    runStep(0);
    return () => { cancelled = true; };
  }, []);

  const barWidthInterp = barWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const loadingMessages = [
    percent < 20  ? 'شروع ہو رہا ہے...'          : '',
    percent < 40  ? 'وسائل لوڈ ہو رہے ہیں...'     : '',
    percent < 60  ? 'AI سسٹم تیار ہو رہا ہے...'  : '',
    percent < 80  ? 'فتویٰ ڈیٹا بیس لوڈ...'       : '',
    percent < 95  ? 'تقریباً مکمل ہو گیا...'       : '',
    percent >= 95 ? 'خوش آمدید!'                   : '',
  ].find(Boolean) ?? '';

  return (
    <Animated.View style={[styles.loadRoot, { opacity: fadeIn }]}>
      {/* Logo area */}
      <View style={styles.logoArea}>
        <Animated.View style={[styles.logoCircle, { transform: [{ scale: sparkle }] }]}>
          <Text style={styles.logoEmoji}>☪</Text>
        </Animated.View>
        <Text style={styles.appName}>Dar Al-Ifta AI</Text>
        <Text style={styles.appTagline}>Authentic Shariah Guidance</Text>
      </View>

      {/* Progress section */}
      <View style={styles.progressArea}>
        {/* Status message */}
        <Text style={styles.statusMsg}>{loadingMessages}</Text>

        {/* Percentage */}
        <Text style={styles.percentText}>{percent}%</Text>

        {/* Bar track */}
        <View style={styles.barTrack}>
          <Animated.View style={[styles.barFill, { width: barWidthInterp }]}>
            {/* Shimmer glow at leading edge */}
            <View style={styles.barGlow} />
          </Animated.View>
        </View>

        <Text style={styles.footerText}>دار الإفتاء — مستند اسلامی رہنمائی</Text>
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)"        options={{ headerShown: false }} />
      <Stack.Screen name="fatwa/[id]"    options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="about"         options={{ headerShown: false }} />
      <Stack.Screen name="chat-history"  options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Safety fallback: proceed after 6s even if fonts fail
  const [timedOut, setTimedOut] = useState(false);
  const [loadingDone, setLoadingDone] = useState(false);
  const [showApp, setShowApp] = useState(false);

  const fontsReady = fontsLoaded || !!fontError || timedOut;

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(t);
  }, []);

  // Hide native splash as soon as React renders (our screen takes over)
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Show app only when both loading animation AND fonts are ready
  useEffect(() => {
    if (loadingDone && fontsReady) {
      setShowApp(true);
    }
  }, [loadingDone, fontsReady]);

  if (!showApp) {
    return (
      <LoadingScreen
        onComplete={() => setLoadingDone(true)}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProvider>
                <RootLayoutNav />
              </AppProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const GOLD   = '#F5C542';
const BG     = '#080F0D';
const GREEN  = '#16261D';

const styles = StyleSheet.create({
  loadRoot: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 120,
    paddingBottom: 70,
    paddingHorizontal: 40,
  },

  // Logo
  logoArea: {
    alignItems: 'center',
    gap: 16,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 44,
    color: GOLD,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: 13,
    color: '#7A9E93',
    letterSpacing: 1,
  },

  // Progress
  progressArea: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  statusMsg: {
    fontSize: 13,
    color: '#7A9E93',
    marginBottom: 4,
  },
  percentText: {
    fontSize: 38,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: -1,
  },
  barTrack: {
    width: '100%',
    height: 6,
    borderRadius: 99,
    backgroundColor: GREEN,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 99,
    backgroundColor: GOLD,
  },
  barGlow: {
    position: 'absolute',
    right: 0,
    top: -4,
    width: 16,
    height: 14,
    borderRadius: 8,
    backgroundColor: GOLD,
    opacity: 0.6,
  },
  footerText: {
    fontSize: 11,
    color: '#3A5A50',
    marginTop: 6,
  },
});
