'use client';

import { useId } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { FormProvider, useForm } from 'react-hook-form';
import {
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';
import * as stylex from '@stylexjs/stylex';
import { field } from '@/styles/field';
import { sendSMSOTP } from '@/api/auth';
import Button from '@/components/Button';
import CountryCodeSelect from '@/components/CountryCodeSelect';
import PhoneNumberInput from '@/components/PhoneNumberInput';

interface FormValue {
  countryCode: CountryCode;
  phoneNumber: string;
}

export default function PhoneForm() {
  const router = useRouter();
  const inputId = useId();
  const errorId = useId();
  const phoneNumberForm = useForm<FormValue>({
    defaultValues: {
      countryCode: 'KR',
      phoneNumber: '',
    },
  });
  const error = phoneNumberForm.formState.errors.phoneNumber;
  const sendCode = useMutation({
    mutationFn: sendSMSOTP,
    onSuccess: () => router.push('/signup/phone/otp'),
    onError: ({ message }) =>
      phoneNumberForm.setError('phoneNumber', { message }),
  });

  const onSubmit = ({ countryCode, phoneNumber }: FormValue) => {
    const wholeNumber = parsePhoneNumberFromString(
      phoneNumber,
      countryCode,
    )?.number;
    if (!wholeNumber) {
      return;
    }
    sendCode.mutate(wholeNumber);
  };

  return (
    <FormProvider {...phoneNumberForm}>
      <form noValidate onSubmit={phoneNumberForm.handleSubmit(onSubmit)}>
        <div {...stylex.props(field.root)}>
          <label htmlFor={inputId} {...stylex.props(field.label)}>
            Phone number
          </label>
          <div {...stylex.props(styles.row)}>
            <CountryCodeSelect />
            <PhoneNumberInput id={inputId} errorId={errorId} />
          </div>
          {error && (
            <p id={errorId} role="alert" {...stylex.props(field.error)}>
              {error.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={sendCode.isPending}
          xstyle={styles.submit}
        >
          Send code
        </Button>
      </form>
    </FormProvider>
  );
}

const styles = stylex.create({
  row: {
    display: 'flex',
    gap: '8px',
  },
  submit: {
    marginTop: '16px',
  },
});
