// Super admin Telegram user IDs - replace with actual super admin IDs
export const SUPER_ADMINS = [754041005, 987654321]; // Replace with real Telegram user IDs

/**
 * Check if a user is a super admin
 * @param user - User object or user_id number
 * @returns true if user is a super admin, false otherwise
 */
export function isSuperAdmin(user: any): boolean {
  const userId = typeof user === 'number' ? user : user.user_id;
  return SUPER_ADMINS.includes(userId);
} 