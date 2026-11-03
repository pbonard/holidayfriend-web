import * as stylex from '@stylexjs/stylex';
import { auth } from '@/styles/tokens.stylex';

// shared by every form field (email, phone, country code), so the inputs look alike
export const field = stylex.create({
  root: {
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
  error: {
    marginTop: '8px',
    fontSize: '14px',
    color: auth.danger,
  },
});
