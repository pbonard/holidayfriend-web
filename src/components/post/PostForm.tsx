'use client';

import { useRouter } from 'next/navigation';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import type { CreatePostRequest, PostFormValue } from '@/types/post';
import Button from '@/components/Button';
import BodyInput from '@/components/post/BodyInput';
import PlacesInput from '@/components/post/PlacesInput';
import RoleInput from '@/components/post/RoleInput';
import TitleInput from '@/components/post/TitleInput';

export function emptyPostForm(): PostFormValue {
  return {
    role: 'traveler',
    places: [],
    title: '',
    body: '',
  };
}

interface PostFormProps {
  defaultValues: PostFormValue;
  submitLabel: string;
  isPending: boolean;
  // why the last submit failed, from the server
  errorMessage?: string;
  onSubmit: (request: CreatePostRequest) => void;
}

// shared by the create and update screens, the screen decides which request it sends
export default function PostForm({
  defaultValues,
  submitLabel,
  isPending,
  errorMessage,
  onSubmit,
}: PostFormProps) {
  const router = useRouter();
  const postForm = useForm<PostFormValue>({ defaultValues });
  const role = useWatch({ control: postForm.control, name: 'role' });
  const isTraveler = role === 'traveler';

  const handleSubmit = (formValues: PostFormValue) => {
    const { role, places, title, body } = formValues;
    onSubmit({
      role,
      // a traveler's places stay in the form when switching to local, a local's city is the one their profile is based in
      ...(role === 'traveler' && { places }),
      title: title.trim(),
      body: body.trim(),
    });
  };

  return (
    <FormProvider {...postForm}>
      <form
        noValidate
        onSubmit={postForm.handleSubmit(handleSubmit)}
        {...stylex.props(styles.card)}
      >
        <RoleInput />
        {isTraveler && <PlacesInput />}
        <div {...stylex.props(styles.content)}>
          <TitleInput />
          <BodyInput />
        </div>
        {errorMessage && (
          <p role="alert" {...stylex.props(styles.error)}>
            {errorMessage}
          </p>
        )}
        <div {...stylex.props(styles.actions)}>
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => router.back()}
            xstyle={styles.cancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} xstyle={styles.submit}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

const styles = stylex.create({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: { default: '20px', [breakpoints.desktop]: '28px' },
    padding: { default: '20px', [breakpoints.desktop]: '32px' },
    backgroundColor: auth.card,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: auth.cardBorder,
    borderRadius: '18px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '12px',
  },
  error: {
    fontSize: '14px',
    lineHeight: '20px',
    color: auth.danger,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    // a little more than the card's gap between its fields, so the buttons read as the end of the form
    paddingTop: '8px',
  },
  cancel: {
    width: '104px',
    height: '54px',
    backgroundColor: 'transparent',
  },
  submit: {
    width: '120px',
    height: '54px',
  },
});
