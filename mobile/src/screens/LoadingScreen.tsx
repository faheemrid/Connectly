import React, { useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
type Props = NativeStackScreenProps<RootStackParamList, 'Loading'>;
const LoadingScreen = ({ navigation ,route}: Props) => {
  const {nextScreen}= route.params
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace(nextScreen);
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigation,nextScreen]);
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.title}> Connectly </Text>
        <Text style={styles.text}>Please wait...</Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 25,
  },
  text: {
    color: '#9CA3AF',
    fontSize: 15,
    marginTop: 8,
  },
});
export default LoadingScreen;
