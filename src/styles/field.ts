import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';

// shared by every form field (email, phone, country code), so the inputs look alike
export const field = stylex.create({
  root: {
    // what field.error is placed against
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 700,
  },
  control: {
    height: '50px',
    paddingInline: '14px',
    borderRadius: '10px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: { default: auth.border, ':focus': auth.link },
    outline: 'none',
    backgroundColor: auth.control,
    color: auth.text,
    fontFamily: 'inherit',
    // 16px keeps ios safari from zooming in on focus
    fontSize: '16px',
    '::placeholder': {
      color: auth.placeholder,
    },
  },
  controlError: {
    borderColor: auth.danger,
  },
  // takes no space, so an error never moves what is around it: the space under a field has to fit its one line
  error: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    fontSize: '14px',
    lineHeight: '20px',
    color: auth.danger,
  },
});
