import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKey } from '@/constants';
import { getMyProfileBrief, getProfileStatus, saveProfile } from '@/api/profile';

export function useProfileStatus() {
  return useQuery({
    queryKey: [queryKey.PROFILE, queryKey.GET_PROFILE_STATUS],
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveProfile,
    // the profile's status and brief: having one now, and its name and city
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [queryKey.PROFILE] }),
  });
}

export function useMyProfileBrief() {
  return useQuery({
    queryKey: [queryKey.PROFILE, queryKey.GET_MY_PROFILE_BRIEF],
    queryFn: getMyProfileBrief,
  });
}
