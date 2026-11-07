import { useMutation, useQuery } from '@tanstack/react-query';
import { getProfileStatus, saveProfile } from '@/api/profile';

export function useProfileStatus() {
  return useQuery({
    queryKey: ['profileStatus'],
    queryFn: getProfileStatus,
    // asked again on every visit: finishing onboarding changes the answer, and so does another account logging in
    gcTime: 0,
    // the page offers its own retry
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useSaveProfile() {
  return useMutation({
    mutationFn: saveProfile,
  });
}
