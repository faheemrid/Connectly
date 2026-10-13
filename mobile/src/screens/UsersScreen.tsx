import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
type Props = NativeStackScreenProps<RootStackParamList, 'Users'>;
type User = {
  _id: string;
  name: string;
  email: string;
  profileImage: string;
  isOnline: boolean;
  lastSeen: string | null;
};
const UsersScreen = ({ navigation }: Props) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const fetchUsers = async () => {
    console.log('🔥 FETCH USERS CALLED');
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }
      const response = await fetch(`${BASE_URL}/api/users`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert('Error', data.message || 'Failed to fetch users');
        return;
      }
      console.log('USERS API RESPONSE:', data.users);
      setUsers(data.users);
    } catch (error) {
      console.log('Fetch users error:', error);
      Alert.alert('Error', 'Unable to fetch users');
    } finally {
      setLoading(false);
    }
  };
  const getCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (error) {
      console.log('Get current user error:', error);
    }
  };
  const formatLastSeen = (data: string | null) => {
    if (!data) {
      return 'Offline';
    }
    const lastSeen = new Date(data);
    const now = currentTime;
    const diffInMinutes = Math.floor(
      (now.getTime() - lastSeen.getTime()) / (1000 * 60),
    );
    if (diffInMinutes < 1) {
      return 'just Now';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hr ago`;
    }
    return lastSeen.toLocaleDateString();
  };
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };
  useEffect(() => {
    console.log('🔥 USERS EFFECT RUN');

    fetchUsers();
    getCurrentUser();
    let socket: Socket | null = null;
    const connectSocket = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (!userData) {
          console.log('Current user not found');
          return;
        }
        const user = JSON.parse(userData);
        if (!user?.id) {
          console.log('Current user ID not found');
          return;
        }
        console.log(' UsersScreen connecting socket...');
        socket = io(BASE_URL);
        socket.on('connect', () => {
          console.log('UsersScreen socket connected', socket?.id);
          socket?.emit('join', user.id);
          console.log(' UsersScreen joined room:', user.id);
        });
        socket.on('userOnline', ({ userId }) => {
          console.log('User Online:', userId);
          setUsers(previousUsers =>
            previousUsers.map(item =>
              item._id === userId ? { ...item, isOnline: true } : item,
            ),
          );
        });
        socket.on('userOffline', ({ userId, lastSeen }) => {
          console.log('User Offline:', userId);
          console.log('Last Seen:', lastSeen);
          setUsers(previousUsers => {
            const updatedUsers = previousUsers.map(item =>
              item._id === userId
                ? {
                    ...item,
                    isOnline: false,
                    lastSeen: lastSeen,
                  }
                : item,
            );
            console.log('UPDATED USERS:', updatedUsers);
            return updatedUsers;
          });
        });
        socket.on('disconnect', () => {
          console.log(' UsersScreen socket disconnected');
        });
      } catch (error) {
        console.log('UsersScreen socket error:', error);
      }
    };
    connectSocket();
    // return () => {
    //   console.log('🔴 USERS SCREEN UNMOUNT');
    //   console.log('UsersScreen closing socket...');
    //   socket?.disconnect();
    // };
    return () => {
      console.log(' UsersScreen closing socket...');
      socket?.disconnect();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    },  1000);
    return () => {
      clearInterval(timer);
    };
  }, []);
  const renderUser = ({ item }: { item: User }) => {
    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('Chat', {
            userId: item._id,
            userName: item.name,
          })
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.message}>{item.email}</Text>
        </View>
        <Text style={item.isOnline ? styles.online : styles.offline}>
          {item.isOnline ? 'Online' : formatLastSeen(item.lastSeen)}
        </Text>
      </TouchableOpacity>
    );
  };
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>Connectly</Text>
          <Text style={styles.headerSubtitle}>Your conversations</Text>
        </View>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileText}>
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
          </Text>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4F46E5"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item._id}
          renderItem={renderUser}
          contentContainerStyle={[styles.list, { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4F46E5',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 3,
  },
  profileAvatar: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  list: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 18,
    marginBottom: 12,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4F46E5',
  },
  onlineDot: {
    width: 13,
    height: 13,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 14,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  online: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '600',
  },
  offline: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
});
export default UsersScreen;
