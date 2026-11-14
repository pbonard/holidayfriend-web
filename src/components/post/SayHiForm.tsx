import { useEffect, useEffectEvent } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import * as stylex from '@stylexjs/stylex';
import { useSendInvite } from '@/hooks/useInvite';
import { auth } from '@/styles/tokens.stylex';
import Button from '@/components/Button';
import MessageInput from '@/components/post/MessageInput';

// how long the "sent" note stays before the sheet closes by itself
const SENT_CLOSE_MS = 1400;

// the form's value, the form's and its MessageInput's
export interface SayHiFormValue {
  message: string;
}

type SayHiFormProps = {
  authorId: string;
  authorName: string;
  // asked a moment after it's sent: the "sent" note shows first
  onClose: () => void;
};

// an invite to the author of a post, with a message, for a Modal. the author sees it in their requests and chats
// once they accept. its parent mounts it while the modal is open, so the message and the send start over each time
export default function SayHiForm({
  authorId,
  authorName,
  onClose,
}: SayHiFormProps) {
  const sayHiForm = useForm<SayHiFormValue>({ defaultValues: { message: '' } });
  const message = useWatch({ control: sayHiForm.control, name: 'message' });
  const sendInviteMutation = useSendInvite();

  const sent = sendInviteMutation.isSuccess;
  // a moment for the "sent" note, then away. the timer goes with the form if the sheet closes first
  const closeAfterSent = useEffectEvent(() => onClose());
  useEffect(() => {
    if (!sent) {
      return;
    }
    const timer = window.setTimeout(closeAfterSent, SENT_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [sent]);

  const handleSubmit = (formValue: SayHiFormValue) => {
    sendInviteMutation.mutate({
      toUserId: authorId,
      message: formValue.message.trim(),
    });
  };

  if (sent) {
    return (
      <p role="status" {...stylex.props(styles.sent)}>
        Sent. {authorName || 'They'} will see it in their requests.
      </p>
    );
  }

  return (
    <FormProvider {...sayHiForm}>
      <form
        noValidate
        onSubmit={sayHiForm.handleSubmit(handleSubmit)}
        {...stylex.props(styles.form)}
      >
        <MessageInput recipientName={authorName || 'them'} />
        <div {...stylex.props(styles.footer)}>
          {/* the server's words: already invited, already chatting, and such */}
          {sendInviteMutation.isError && (
            <p role="alert" {...stylex.props(styles.error)}>
              {sendInviteMutation.error.message}
            </p>
          )}
          {/* waits for a message, only spaces is none */}
          <Button
            type="submit"
            disabled={!message.trim() || sendInviteMutation.isPending}
            xstyle={styles.send}
          >
            {sendInviteMutation.isPending ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

const styles = stylex.create({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  error: {
    flexGrow: 1,
    fontSize: '14px',
    color: auth.danger,
  },
  // on the right, the error beside it when there's one
  send: {
    width: 'auto',
    height: '44px',
    flexShrink: 0,
    marginLeft: 'auto',
    paddingInline: '24px',
    fontSize: '16px',
  },
  sent: {
    paddingBlock: '24px',
    fontSize: '16px',
    textAlign: 'center',
    color: auth.link,
  },
});
