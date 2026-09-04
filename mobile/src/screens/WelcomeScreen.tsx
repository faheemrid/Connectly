import React from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;
const WelcomeScreen = ({ navigation }: Props) => {
  return (
    <View style={styles.container}>
      <StatusBar  barStyle="dark-content" />
      <View style={styles.topSection}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>C</Text>
        </View>
        <Text style={styles.brand}>Connectly</Text>
      </View>
      <View style={styles.illustrationContainer}>
        <View style={[styles.bubble, styles.bubbleOne]}>
          <Text style={styles.bubbleText}>Hi 👋</Text>
        </View>
        <View style={[styles.bubble, styles.bubbleTwo]}>
          <Text style={styles.bubbleText}>How are you?</Text>
        </View>
        <View style={styles.chatIcon}>
          <Text style={styles.chatIconText}>💬</Text>
        </View>
        <View style={[styles.bubble, styles.bubbleThree]}>
          <Text style={styles.bubbleText}>Let's connect!</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>
          Stay connected{'\n'}
          with the people{'\n'}
          who matter.
        </Text>
        <Text style={styles.description}>
          Chat, share and stay close to your friends — anytime, anywhere.
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.secondaryButtonText}>Create an account</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.footer}>Simple. Private. Connected.</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
   backgroundColor: "#F8FAFC",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 22,
  },

  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  brand: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111827',
  },
  illustrationContainer: {
    height: 260,
    marginTop: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatIcon: {
    width: 130,
    height: 130,
    borderRadius: 45,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },

  chatIconText: {
    fontSize: 58,
  },
  bubble: {
    position: 'absolute',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },
  bubbleOne: {
    top: 22,
    left: 20,
  },
  bubbleTwo: {
    top: 75,
    right: 5,
  },
  bubbleThree: {
    bottom: 18,
    left: 45,
  },
  bubbleText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    marginTop: 4,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.8,
  },

  description: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 23,
    color: '#6B7280',
    maxWidth: 330,
  },

  actions: {
    marginTop: 22,
    gap: 11,
  },

  primaryButton: {
    height: 56,
    borderRadius: 17,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 5,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryButton: {
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
  },

  secondaryButtonText: {
    color: '#4F46E5',
    fontSize: 15,
    fontWeight: '700',
  },

  footer: {
    textAlign: 'center',
    marginTop: 'auto',
    color: '#9CA3AF',
    fontSize: 12,
  },
});

export default WelcomeScreen;
