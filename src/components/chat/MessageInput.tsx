'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import * as stylex from '@stylexjs/stylex';
import { CHAT_MESSAGE_MAX } from '@/constants';
import { sendMedia, sendText } from '@/db/pending';
import { useMyId } from '@/hooks/useChat';
import { auth, breakpoints } from '@/styles/tokens.stylex';
import type { Attachment, MediaType } from '@/types/chat';
import Button from '@/components/Button';
import MediaPreview from '@/components/chat/MediaPreview';
import VoiceInput, { canRecordVoice } from '@/components/chat/VoiceInput';
import ImageIcon from '@/components/icons/ImageIcon';
import MicIcon from '@/components/icons/MicIcon';
import SendIcon from '@/components/icons/SendIcon';
import { fitToContent } from '@/utils';
import { readDraft, saveDraft, subscribeDraft } from '@/utils/chatDraft';
import { checkFiles } from '@/utils/file';

// whether the browser can record never changes: read once it's in the browser, none while prerendering
function subscribeNothing() {
  return () => {};
}

// the message being written at the bottom of a chat. Enter sends it, Shift+Enter starts a new line. the microphone
// records a voice message in the input's place (VoiceInput), sent as mobile's "audio". the photos button picks photos
// and videos, shown in the input's place until they're sent, each with an × to take it off. as on
// mobile: the photos as one message, the videos as another, the text as its own. what's sent is cleared at once and
// shows at the end of the chat as pending (db/pending), not sent with a retry when it fails. the text being written is
// kept per chat through a reload (utils/chatDraft)
export default function MessageInput({
  roomId,
  name,
}: {
  roomId: string;
  name: string;
}) {
  const myId = useMyId();
  // this chat's draft. none while prerendering and until the person logged in is known
  const text = useSyncExternalStore(
    subscribeDraft,
    () => (myId ? readDraft(myId, roomId) : ''),
    () => '',
  );
  const setText = (value: string) => {
    if (myId) saveDraft(myId, roomId, value);
  };
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // what's wrong with the files picked, before anything was sent
  const [fileError, setFileError] = useState<string | null>(null);
  // recording a voice message, in the input's place (VoiceInput)
  const [recordingVoice, setRecordingVoice] = useState(false);
  const canRecord = useSyncExternalStore(
    subscribeNothing,
    canRecordVoice,
    () => false,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSend =
    Boolean(myId) && (text.trim().length > 0 || attachments.length > 0);

  // as tall as its text: as it's typed, as a kept draft shows after a reload, and as it's cleared on sending
  useLayoutEffect(() => {
    if (textareaRef.current) fitToContent(textareaRef.current);
  }, [text]);

  // the thumbnails' object urls hold their files in memory until they're let go: those still shown, as it goes
  const attachmentsRef = useRef(attachments);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  useEffect(
    () => () =>
      attachmentsRef.current.forEach(({ url }) => URL.revokeObjectURL(url)),
    [],
  );

  // added to what's shown over the input, not sent yet. none of them when one is wrong
  const pickFiles = async (picked: FileList | null) => {
    const files = Array.from(picked ?? []).filter(
      (file) =>
        file.type.startsWith('image/') || file.type.startsWith('video/'),
    );
    // the same files can be picked again next time
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (files.length === 0) return;
    const problem = await checkFiles(
      files.filter((file) => file.type.startsWith('image/')),
      files.filter((file) => file.type.startsWith('video/')),
    );
    setFileError(problem);
    if (problem) return;
    setAttachments((shown) => [
      ...shown,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((shown) =>
      shown.filter((attachment) => {
        if (attachment.id !== id) return true;
        URL.revokeObjectURL(attachment.url);
        return false;
      }),
    );
  };

  // one message of photos or of videos: kept as pending (db/pending), which keeps it through a reload and shows it at
  // the end of the chat as it goes, or as not sent with retry and delete. its thumbnails' urls go with it to the bubble
  const sendAttachments = (contentType: MediaType, group: Attachment[]) => {
    if (group.length === 0 || !myId) return;
    void sendMedia(
      myId,
      roomId,
      contentType,
      group.map(({ file }) => file),
      group.map(({ url }) => url),
    );
  };

  // the photos and videos while they're shown in the input's place, the text otherwise. a text typed before they were
  // picked waits under them, and comes back once they're sent or taken off
  const send = () => {
    setFileError(null);
    if (!myId) return;

    if (attachments.length > 0) {
      const sending = attachments;
      setAttachments([]);
      void sendAttachments(
        'image',
        sending.filter(({ file }) => file.type.startsWith('image/')),
      );
      void sendAttachments(
        'video',
        sending.filter(({ file }) => file.type.startsWith('video/')),
      );
      return;
    }

    const message = text.trim();
    if (message) {
      setText('');
      void sendText(myId, roomId, message);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      {...stylex.props(styles.bar)}
    >
      {fileError && (
        <p role="alert" {...stylex.props(styles.error)}>
          {fileError}
        </p>
      )}
      {recordingVoice ? (
        <VoiceInput
          onCancel={() => setRecordingVoice(false)}
          onSend={(file, url) => {
            setRecordingVoice(false);
            if (myId) void sendMedia(myId, roomId, 'audio', [file], [url]);
          }}
        />
      ) : (
        <div {...stylex.props(styles.row)}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={(event) => void pickFiles(event.target.files)}
          />
          <Button
            variant="secondary"
            aria-label="Add photos or videos"
            onClick={() => fileInputRef.current?.click()}
            xstyle={styles.square}
          >
            <ImageIcon size={20} />
          </Button>
          {canRecord && (
            <Button
              variant="secondary"
              aria-label="Record a voice message"
              // not with photos picked: those are sent first
              disabled={!myId || attachments.length > 0}
              onClick={() => {
                setFileError(null);
                setRecordingVoice(true);
              }}
              xstyle={styles.square}
            >
              <MicIcon size={20} />
            </Button>
          )}
          {attachments.length > 0 ? (
            // in the input's place: no typing while they're there
            <div {...stylex.props(styles.input, styles.mediaBox)}>
              <MediaPreview
                attachments={attachments}
                onRemove={removeAttachment}
              />
            </div>
          ) : (
            <textarea
              ref={(textarea) => {
                textareaRef.current = textarea;
                // back after the photos: as tall as the text kept under them
                if (textarea) fitToContent(textarea);
              }}
              aria-label={`Message to ${name || 'them'}`}
              rows={1}
              maxLength={CHAT_MESSAGE_MAX}
              value={text}
              // until the person logged in is known: what's typed is kept under them
              readOnly={!myId}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                // not while an input method composes a character (korean, japanese…): its Enter picks the character
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  send();
                }
              }}
              {...stylex.props(styles.input)}
            />
          )}
          <Button
            type="submit"
            disabled={!canSend}
            aria-label="Send"
            xstyle={styles.square}
          >
            <SendIcon size={20} />
          </Button>
        </div>
      )}
    </form>
  );
}

const styles = stylex.create({
  bar: {
    flexShrink: 0,
    paddingBlock: '16px',
    paddingInline: { default: '12px', [breakpoints.desktop]: '24px' },
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: auth.cardBorder,
  },
  row: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
  },
  // Button's looks, an icon in a square as tall as the input's first line
  square: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '48px',
    height: '48px',
    padding: 0,
    borderRadius: '12px',
  },
  // grows with its text up to a few lines, then scrolls
  input: {
    flexGrow: 1,
    minWidth: 0,
    minHeight: '48px',
    maxHeight: '160px',
    paddingBlock: '12px',
    paddingInline: '14px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.border, ':focus': auth.link },
    borderRadius: '12px',
    outline: 'none',
    resize: 'none',
    backgroundColor: auth.input,
    color: auth.text,
    fontFamily: 'inherit',
    // 16px keeps ios safari from zooming in on focus
    fontSize: '16px',
    lineHeight: 1.4,
  },
  // the input's look around the thumbnails, as tall as they are
  mediaBox: {
    maxHeight: 'none',
    paddingBlock: '6px',
    paddingInline: '8px',
  },
  error: {
    marginBottom: '10px',
    fontSize: '14px',
    color: auth.danger,
  },
});
