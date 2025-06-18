export interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
}

export interface AppUser {
  user_id: number;
  username: string;
  profile_photo_url?: string; // User's profile photo URL
  first_name?: string; // User's first name
  last_name?: string; // User's last name
  isPublicUser?: boolean; // Whether user is a public Cinema Mode user
  channel_id?: string | null; // Drive Mode channel ID, null for Cinema Mode users
}

export interface FileData {
  _id: string; // MongoDB ObjectId
  owner_id: number; // User ID
  channel_id: number; // Telegram channel ID
  file_id: string; // Telegram file ID
  file_type: 'document' | 'photo' | 'video' | 'audio'; // Type of file
  caption?: string; // File caption, if available
  date: string; // ISO date string
  message_id: number; // Telegram message ID
  file_name?: string; // Original file name, if available
  file_size?: number; // File size in bytes, if available
  mime_type?: string; // MIME type, if available
  file_extension?: string; // File extension with dot (e.g. ".pdf")
  thumb_file_id?: string; // Thumbnail file ID, if available
  thumb_width?: number; // Thumbnail width, if available
  thumb_height?: number; // Thumbnail height, if available
}