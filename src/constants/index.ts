// the login steps are separate pages, sessionStorage keeps these across them and a page reload
export const VERIFICATION_ID = 'verificationId';
export const EMAIL = 'email';
export const START_OVER = 'Go back and enter your email again';

// react query keys, [domain, query, ...arguments]: a whole domain can be refreshed with just its first part,
// e.g. invalidateQueries({ queryKey: [queryKey.POST] }) after writing a post
export const queryKey = {
  PROFILE: 'profile',
  GET_PROFILE_STATUS: 'getProfileStatus',
  GET_MY_PROFILE_BRIEF: 'getMyProfileBrief',
  POST: 'post',
  GET_CITY_POSTS: 'getCityPosts',
};
