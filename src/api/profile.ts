import { axiosInstance } from '@/api/axios';
import type { ProfileBrief, ProfileFormValue } from '@/types/profile';

// the server's own 404 body. matched exactly because a missing route is a 404 too, and that must not send someone to onboarding
const PROFILE_NOT_FOUND = 'Profile not found';

export async function getProfileStatus(): Promise<{ hasProfile: boolean }> {
  try {
    await axiosInstance.get('/api/profile');
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
  const { data } = await axiosInstance.get('/api/profile');
  return data;
}
