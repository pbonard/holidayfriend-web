# Voice metering

Voice messages with a live meter while recording and a saved waveform, set aside for now. The app's voice messages work without it.

## What's here

These files sit at the same paths as they would under `src/`.

- `utils/waveform.ts` measures loudness with an `AnalyserNode`. It also turns the levels into a 48-digit string (`0`–`9`) and back.
- `components/chat/WaveformBars.tsx` draws levels as bars, for both the live meter and the waveform.
- `components/chat/VoiceInput.tsx` is the recorder with the live meter. On Stop it builds the waveform, and `onSend(file, url, waveform)` passes it on.
- `components/chat/VoicePlayer.tsx` is the player. When it gets a `waveform` prop it draws bars in place of the line.
- `components/chat/VoiceMessage.tsx` passes `contents[1]` on to the player as the waveform.

## What else it needs

The waveform travels as `contents[1]` of an `audio` message, after the file name, so:

- **Web**
  - `db/pending.ts` keeps `waveform` on the record and sends `[...uploaded, waveform]`.
  - `sendMedia` takes the waveform.
  - `MessageItem` renders `audio` as one `VoiceMessage` with `contents[0]` and `contents[1]`.
  - `db/media.ts` downloads only `contents[0]` for `audio`.
- **my-server**
  - chat's `PublishMessaging` must check and consume only `contents[0]` of an `audio` message as the upload.
  - messagepreprocess must record only `contents[0]` in `ids_by_filename`.
  - Without this, my-server answers `bad request`. A helper for both, `common.MediaFilenames(contentType, contents)`, returns `contents[:1]` for `audio`.
- **Mobile** must save and download only `contents[0]` of an `audio` message. Otherwise it tries to download the waveform as a file.
