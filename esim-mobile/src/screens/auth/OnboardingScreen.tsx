import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AuthStackParamList } from '../../navigation/types';
import { navigationRef } from '../../navigation/navigationRef';
import { colors, radii, shadows, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

export const OnboardingScreen = ({ navigation, route }: Props) => {
  const skipAnimation = route.params?.skipAnimation === true;
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'logo' | 'content'>(skipAnimation ? 'content' : 'logo');

  // Phase 1 — Logo animation
  const planeY = useRef(new Animated.Value(-45)).current;
  const planeOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Transition
  const purpleOverlay = useRef(new Animated.Value(skipAnimation ? 0 : 1)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(skipAnimation ? 0 : 1)).current;

  // Phase 2 — Content animation
  const badgeAnim = useRef(new Animated.Value(skipAnimation ? 1 : 0)).current;
  const badgeSlide = useRef(new Animated.Value(skipAnimation ? 0 : 20)).current;
  const headlineAnim = useRef(new Animated.Value(skipAnimation ? 1 : 0)).current;
  const headlineSlide = useRef(new Animated.Value(skipAnimation ? 0 : 20)).current;
  const subtitleAnim = useRef(new Animated.Value(skipAnimation ? 1 : 0)).current;
  const subtitleSlide = useRef(new Animated.Value(skipAnimation ? 0 : 20)).current;
  const buttonsAnim = useRef(new Animated.Value(skipAnimation ? 1 : 0)).current;
  const buttonsScale = useRef(new Animated.Value(skipAnimation ? 1 : 0.9)).current;

  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (skipAnimation) return;

    const phaseTimer = setTimeout(() => {
      setPhase('content');
    }, 2400);

    animationRef.current = Animated.sequence([
      // Phase 1 — Plane animation
      Animated.parallel([
        Animated.timing(planeOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(planeY, {
          toValue: -32,
          duration: 400,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(wordmarkOpacity, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 600,
          delay: 500,
          useNativeDriver: true,
        }),
      ]),
      // Plane takes off
      Animated.timing(planeY, {
        toValue: -80,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.quad),
      }),
      Animated.delay(200),
      // Plane descends back
      Animated.timing(planeY, {
        toValue: -32,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.quad),
      }),
      // Plane settles
      Animated.spring(planeY, {
        toValue: -36,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      // Hold logo visible briefly
      Animated.delay(500),
      // Transition — fade out purple, move logo up and out
      Animated.parallel([
        Animated.timing(purpleOverlay, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(logoTranslateY, {
          toValue: -40,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.quad),
        }),
        Animated.timing(logoScale, {
          toValue: 0.7,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 400,
          delay: 200,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2 — Content slides in
      Animated.parallel([
        Animated.timing(badgeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(badgeSlide, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(headlineAnim, {
          toValue: 1,
          duration: 500,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(headlineSlide, {
          toValue: 0,
          duration: 500,
          delay: 100,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleAnim, {
          toValue: 1,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleSlide, {
          toValue: 0,
          duration: 500,
          delay: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsAnim, {
          toValue: 1,
          duration: 400,
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.timing(buttonsScale, {
          toValue: 1,
          duration: 400,
          delay: 300,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animationRef.current.start();

    return () => {
      clearTimeout(phaseTimer);
      animationRef.current?.stop();
    };
  }, [skipAnimation]);

  return (
    <View style={styles.root}>
      {/* Layer 1 — Background travel image (always mounted, hidden during phase 1) */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1764917301484-97d70fc082dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[colors.transparent, colors.overlayLight, colors.overlayStrong]}
          locations={[spacing[0], 0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      {/* Layer 2 — Purple overlay (fades out during transition) */}
      <Animated.View
        style={[
          styles.purpleOverlay,
          { opacity: purpleOverlay },
        ]}
      />

      {/* Layer 3 — Logo (visible during phase 1, fades out during transition) */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoOpacity,
            transform: [
              { translateY: logoTranslateY },
              { scale: logoScale },
            ],
          },
        ]}
      >
        {/* Plane */}
        <Animated.View
          style={[
            styles.planeWrapper,
            {
              opacity: planeOpacity,
              transform: [{ translateY: planeY }],
            },
          ]}
        >
          <Ionicons
            name="airplane"
            size={sizes.icon.lg}
            color={colors.secondary.DEFAULT}
            style={styles.planeIcon}
          />
        </Animated.View>

        {/* Wordmark */}
        <Animated.View style={[styles.wordmarkRow, { opacity: wordmarkOpacity }]}>
          <Text style={styles.wordmarkNety}>nety</Text>
          <Text style={styles.wordmarkFly}>fly</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          connecté partout dans le monde
        </Animated.Text>
      </Animated.View>

      {/* Layer 3.5 — Wordmark (visible during phase 2) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.wordmarkHeader,
          {
            opacity: badgeAnim,
            transform: [{ translateY: badgeSlide }],
            top: insets.top + spacing.lg,
          },
        ]}
      >
        <Text style={styles.wordmarkHeaderNety}>nety</Text>
        <Text style={styles.wordmarkHeaderFly}>fly</Text>
      </Animated.View>

      {/* Layer 4 — Content (visible during phase 2) */}
      <View
        pointerEvents={phase === 'content' ? 'auto' : 'none'}
        style={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
      >
        {/* Badge */}
        <Animated.View
          style={[
            styles.badge,
            {
              opacity: badgeAnim,
              transform: [{ translateY: badgeSlide }],
            },
          ]}
        >
          <Ionicons name="airplane" size={sizes.icon.sm} color={colors.secondary.DEFAULT} />
          <Text style={styles.badgeText}>#1 eSIM pour les Tunisiens</Text>
        </Animated.View>

        {/* Headline */}
        <Animated.View
          style={{
            opacity: headlineAnim,
            transform: [{ translateY: headlineSlide }],
          }}
        >
          <Text style={styles.headline}>
            Explorez le monde,{`\n`}
            <Text style={styles.headlineAccent}>Restez connecté.</Text>
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: subtitleAnim,
              transform: [{ translateY: subtitleSlide }],
            },
          ]}
        >
          Connectivité instantanée dans 190+ pays. Sans frais d'itinérance. Sans SIM physique.
        </Animated.Text>

        {/* Buttons */}
        <Animated.View
          style={{
            opacity: buttonsAnim,
            transform: [{ scale: buttonsScale }],
          }}
        >
          {/* Get Started */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              AsyncStorage.setItem('netyfly_onboarding_seen', 'true');
              navigationRef.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            }}
            style={[styles.primaryButton, styles.commencerButton]}
          >
            <Ionicons name="arrow-forward" size={sizes.icon.sm} color={colors.white} />
            <Text style={styles.commencerButtonText}>Commencer</Text>
          </TouchableOpacity>

          {/* Reseller Access */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('ResellerLogin')}
            style={[styles.miniButton, styles.resellerButton]}
          >
            <Ionicons name="briefcase-outline" size={sizes.icon.sm} color={colors.white} />
            <Text style={styles.resellerButtonText}>Accès Revendeur</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Login', { source: 'onboarding' })}
            style={styles.loginLink}
          >
            <Text style={styles.loginLinkText}>
              Déjà un compte ? <Text style={styles.loginLinkAccent}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary.DEFAULT,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  purpleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary.DEFAULT,
  },
  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planeWrapper: {
    position: 'absolute',
    left: '50%',
    marginLeft: -spacing.xxxxxl + spacing.xs,
    zIndex: 10,
  },
  planeIcon: {
    transform: [{ rotate: '-90deg' }],
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  wordmarkNety: {
    ...typography.authWordmark,
    color: colors.white,
  },
  wordmarkFly: {
    ...typography.authWordmark,
    color: colors.secondary.DEFAULT,
  },
  tagline: {
    ...typography.bodySM,
    color: colors.state.onPrimaryOverlay60,
    letterSpacing: typography.overline.letterSpacing,
    textTransform: 'uppercase',
    marginTop: spacing.md,
  },
  wordmarkHeader: {
    position: 'absolute',
    left: spacing.xl,
    flexDirection: 'row',
    alignItems: 'baseline',
    zIndex: 5,
  },
  wordmarkHeaderNety: {
    ...typography.titleLG,
    color: colors.white,
    fontWeight: '800',
  },
  wordmarkHeaderFly: {
    ...typography.titleLG,
    color: colors.secondary.DEFAULT,
    fontWeight: '800',
  },
  content: {
    position: 'absolute',
    bottom: spacing[0],
    left: spacing[0],
    right: spacing[0],
    paddingHorizontal: spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.state.onPrimaryOverlay15,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.state.onPrimaryOverlay15,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  badgeText: {
    ...typography.labelSM,
    color: colors.white,
  },
  headline: {
    ...typography.authHeadline,
    color: colors.white,
    marginBottom: spacing.md,
  },
  headlineAccent: {
    color: colors.secondary.DEFAULT,
  },
  subtitle: {
    ...typography.bodyLG,
    color: colors.state.onPrimaryOverlay85,
    marginBottom: spacing.xxxl,
  },
  primaryButton: {
    marginBottom: spacing.sm,
  },
  commencerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.primary.DEFAULT,
    borderWidth: 1.5,
    borderColor: colors.state.onPrimaryOverlay40,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.high,
  },
  commencerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  miniButton: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  resellerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radii.lg,
    backgroundColor: colors.state.onPrimaryOverlay20,
    borderWidth: 1.5,
    borderColor: colors.state.onPrimaryOverlay25,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  resellerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  loginLinkText: {
    ...typography.bodyMD,
    color: colors.state.onPrimaryOverlay70,
    textAlign: 'center',
  },
  loginLinkAccent: {
    color: colors.secondary.DEFAULT,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
