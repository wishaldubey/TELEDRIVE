import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDoc
} from "firebase/firestore";

export interface ChatMessage {
  id?: string;
  fromUserId: number;
  toUserId: number;
  text: string;
  createdAt: Timestamp;
}

export interface ChatRoom {
  id: string;
  users: number[];
  matchId: string;
  matchPercentage: number;
  sharedMovies: string[];
  createdAt: Timestamp;
  lastMessage?: {
    text: string;
    sentAt: Timestamp;
    sentBy: number;
  };
}

// Create a new chat room when users match
export const createChatRoom = async (matchId: string, user1Id: number, user2Id: number, matchPercentage: number, sharedMovies: string[]): Promise<string> => {
  try {
    const roomRef = doc(db, "rooms", matchId);
    
    // Check if room already exists
    const roomDoc = await getDoc(roomRef);
    if (roomDoc.exists()) {
      return matchId; // Return existing room id
    }
    
    // Create new room
    await setDoc(roomRef, {
      users: [user1Id, user2Id],
      matchId,
      matchPercentage,
      sharedMovies,
      createdAt: serverTimestamp()
    });
    
    return matchId;
  } catch (error) {
    console.error("Error creating chat room:", error);
    throw error;
  }
};

// Send a message to a chat room
export const sendMessage = async (roomId: string, fromUserId: number, toUserId: number, text: string): Promise<string> => {
  try {
    // Add message to messages subcollection
    const messagesRef = collection(db, "rooms", roomId, "messages");
    const messageData = {
      fromUserId,
      toUserId,
      text,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(messagesRef, messageData);
    
    // Update room with last message
    const roomRef = doc(db, "rooms", roomId);
    await setDoc(roomRef, {
      lastMessage: {
        text,
        sentAt: serverTimestamp(),
        sentBy: fromUserId
      }
    }, { merge: true });
    
    return docRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Listen to real-time messages from a room
export const listenToMessages = (roomId: string, callback: (messages: ChatMessage[]) => void) => {
  const messagesRef = collection(db, "rooms", roomId, "messages");
  const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));
  
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      return { id: doc.id, ...doc.data() } as ChatMessage;
    });
    callback(messages);
  });
};

// Get user's chat rooms
export const listenToUserRooms = (userId: number, callback: (rooms: ChatRoom[]) => void) => {
  const roomsRef = collection(db, "rooms");
  const roomsQuery = query(roomsRef, where("users", "array-contains", userId));
  
  return onSnapshot(roomsQuery, (snapshot) => {
    const rooms = snapshot.docs.map(doc => {
      return { id: doc.id, ...doc.data() } as ChatRoom;
    });
    callback(rooms);
  });
}; 