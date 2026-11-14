import type { InfiniteData } from '@tanstack/react-query';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { queryKey } from '@/constants';
import {
  acceptInvite,
  declineInvite,
  INVITE_PAGE_SIZE,
  listInvites,
  sendInvite,
} from '@/api/invite';
import type { InviteListItem } from '@/types/invite';

const INVITES = [queryKey.INVITE, queryKey.GET_INVITES];

export function useSendInvite() {
  return useMutation({ mutationFn: sendInvite });
}

// the invites screen: the pending invites sent to the viewer, a page at a time, the next one starting after the
// last invite of the page before
export function useInfiniteInvites() {
  return useInfiniteQuery({
    queryKey: INVITES,
    queryFn: ({ pageParam }) => listInvites(pageParam),
    initialPageParam: undefined as string | undefined,
    // a short page is the last, so there's no request for an empty one
    getNextPageParam: (lastPage) =>
      lastPage.length < INVITE_PAGE_SIZE ? undefined : lastPage.at(-1)?.id,
  });
}

// an answered invite leaves the list where it is, without asking for the pages again: the others don't move.
// also when it's gone already ("Invite not found"), answered in another tab or sent again with a new id
function useRemoveInvite() {
  const queryClient = useQueryClient();
  return (id: string) =>
    queryClient.setQueryData<InfiniteData<InviteListItem[], string | undefined>>(
      INVITES,
      (data) =>
        data && {
          ...data,
          pages: data.pages.map((page) =>
            page.filter((invite) => invite.id !== id),
          ),
        },
    );
}

export function useAcceptInvite() {
  const removeInvite = useRemoveInvite();
  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: (_, id) => removeInvite(id),
  });
}

export function useDeclineInvite() {
  const removeInvite = useRemoveInvite();
  return useMutation({
    mutationFn: declineInvite,
    onSuccess: (_, id) => removeInvite(id),
  });
}
