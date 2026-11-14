import { axiosInstance } from '@/api/axios';
import type { Profile, ProfileBrief, ProfileFormValue } from '@/types/profile';

// the server's own 404 body. matched exactly because a missing route is a 404 too, and that must not send someone to onboarding
export const PROFILE_NOT_FOUND = 'Profile not found';

export async function getProfileStatus(): Promise<{ hasProfile: boolean }> {
  try {
    await axiosInstance.get('/api/profile/brief/my');
    return { hasProfile: true };
  } catch (error) {
    if (error instanceof Error && error.message === PROFILE_NOT_FOUND) {
      return { hasProfile: false };
    }
    throw error;
  }
}

export async function saveProfile(profile: ProfileFormValue): Promise<void> {
  await axiosInstance.put('/api/profile', profile);
}

export async function getMyProfileBrief(): Promise<ProfileBrief> {
  const { data } = await axiosInstance.get('/api/profile/brief/my');
  return data;
}

// a person's profile page. one who has none (or never had) is the error PROFILE_NOT_FOUND
export async function getProfile(id: string): Promise<Profile> {
  const { data } = await axiosInstance.get(`/api/profile/${id}`);
  return data;
}
