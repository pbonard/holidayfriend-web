import { useMutation } from '@tanstack/react-query';
import { sendInvite } from '@/api/invite';

export function useSendInvite() {
  return useMutation({ mutationFn: sendInvite });
}
