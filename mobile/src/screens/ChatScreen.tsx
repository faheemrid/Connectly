import React, { useEffect, useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  FlatList,
  TextInput,
  StatusBar,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../config/api';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;
type BackendMessage = {
  _id: string;
  sender: string;
  receiver: string;
  text: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};
type Message = {
  id: string;
  text: string;
  sender: 'me' | 'other';
  time: string;
};
const ChatScreen = ({ navigation, route }: Props) => {
  const { userId, userName } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isUserOnline, setIsUserOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  const getCurrentUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.log('Get current user error:', error);
    }
  };
  const fetchUserStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return;
      }
      console.log('STATUS TOKEN EXISTS:', !!token);
      console.log('STATUS TOKEN LENGTH:', token?.length);
      const response = await fetch(`${BASE_URL}/api/users`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        console.log('STATUS RESPONSE STATUS:', response.status);
        console.log('STATUS RESPONSE DATA:', data);
        return;
      }
      const targetUser = data.users.find((user: any) => user._id === userId);
      if (targetUser) {
        setIsUserOnline(targetUser.isOnline);
        setLastSeen(targetUser.lastSeen);
      }
    } catch (error) {
      console.log('Fetch user status error:', error);
    }
  };
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  const fetchConversation = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }
      console.log('Fetching conversation...');
      console.log('URL:', `${BASE_URL}/api/messages/${userId}`);
      const response = await fetch(`${BASE_URL}/api/messages/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Conversation status:', response.status);
      console.log('Conversation data:', data);
      if (!response.ok) {
        Alert.alert('Error', data.message || 'Failed to fetch messages');
        return;
      }
      const formattedMessages: Message[] = data.messages.map(
        (item: BackendMessage) => ({
          id: item._id,
          text: item.text,
          sender:
            item.sender.toString() === currentUserId.toString()
              ? 'me'
              : 'other',
          time: formatTime(item.createdAt),
        }),
      );
      setMessages(formattedMessages);
      await markMessagesAsRead()
    } catch (error) {
      console.log('Fetch conversation error:', error);
      Alert.alert('Error', 'Unable to fetch conversation');
    } finally {
      setLoading(false);
    }
  };
  const markMessagesAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('Authentication token not found');
        return;
      }
      const response = await fetch(`${BASE_URL}/api/messages/${userId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        console.log('Mark as read error:', data.message);
        return;
      }
      console.log('Messages marked as read');
    } catch (error) {
      console.log('Mark messages as read error:', error);
    }
  };
  useEffect(() => {
    getCurrentUser();
  }, []);
  useEffect(() => {
    if (currentUserId) {
      fetchConversation();
      fetchUserStatus();
    }
  }, [currentUserId]);
  useEffect(() => {
    if (!currentUserId) {
      return;
    }
    console.log('🔌 Connecting socket...');
    const newSocket = io(BASE_URL);
    setSocket(newSocket);
    newSocket.on('connect', () => {
      console.log('✅ SOCKET CONNECTED:', newSocket.id);
      newSocket.emit('join', currentUserId);
      console.log('👤 Joined room:', currentUserId);
    });
    newSocket.on('newMessage', (data: BackendMessage) => {
      console.log('📩 New message received:', data);
      const newMessage: Message = {
        id: data._id,
        text: data.text,
        sender:
          data.sender.toString() === currentUserId.toString() ? 'me' : 'other',
        time: formatTime(data.createdAt),
      };
      setMessages(previousMessages => {
        if (previousMessages.some(item => item.id === newMessage.id)) {
          return previousMessages;
        }
        return [newMessage, ...previousMessages];
      });
    });
    newSocket.on('userOnline', ({ userId: onlineUserId }) => {
      console.log('🟢 USER ONLINE EVENT:', onlineUserId);
      if (onlineUserId === userId) {
        console.log('✅ Target user came online');
        setIsUserOnline(true);
        setLastSeen(null);
      }
    });
    newSocket.on('userOffline', ({ userId: offlineUserId }) => {
      console.log('🔴 USER OFFLINE EVENT:', offlineUserId);
      if (offlineUserId === userId) {
        console.log('✅ Target user went offline');
        setIsUserOnline(false);
        setLastSeen(new Date().toISOString());
      }
    });
    newSocket.on('disconnect', () => {
      console.log(' Socket disconnected');
    });
    return () => {
      console.log('🔌 Closing socket...');
      newSocket.disconnect();
    };
  }, [currentUserId]);
  const sendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || sending) {
      return;
    }
    try {
      setSending(true);
      if (!socket) {
        Alert.alert('Error', 'Socket is not connected');
        return;
      }
      socket.emit('sendMessage', {
        senderId: currentUserId,
        receiverId: userId,
        text: trimmedMessage,
      });
      setMessage('');
    } catch (error) {
      console.log('Send message error:', error);
      Alert.alert('Error', 'Unable to send message');
    } finally {
      setSending(false);
    }
  };
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender === 'me';
    return (
      <View
        style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.otherMessage,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
            ]}
          >
            {item.time}
          </Text>
        </View>
      </View>
    );
  };
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userName.charAt(0).toUpperCase()}
          </Text>
          {isUserOnline && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{userName}</Text>
          <Text style={styles.headerStatus}>
            {isUserOnline
              ? 'Online'
              : lastSeen
              ? `Last seen ${formatTime(lastSeen)}`
              : 'Offline'}
          </Text>
        </View>
      </View>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          inverted
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={'handled'}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}> No messages yet</Text>
              <Text style={styles.emptySubText}>
                {' '}
                Start the conversation 👋{' '}
              </Text>
            </View>
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || sending) && styles.disabledSendButton,
          ]}
          onPress={sendMessage}
          disabled={!message.trim() || sending}
        >
          <Text style={styles.sendText}>{sending ? '...' : '➤'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 55,
    paddingHorizontal: 16,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    color: '#111827',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    position: 'absolute',
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  headerStatus: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 10,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: '#2F80ED',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#E8E8E8',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#222222',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 5,
  },
  myMessageTime: {
    color: '#DCEBFF',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#777777',
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 100,
    backgroundColor: '#F1F2F4',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    marginRight: 8,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2F80ED',
  },
  disabledSendButton: {
    opacity: 0.5,
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#777',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
  },
  emptySubText: {
    marginTop: 5,
    color: '#777',
  },
});
export default ChatScreen;
