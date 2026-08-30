import DateTimePicker from '@react-native-community/datetimepicker';
import React from 'react';
import { Platform } from 'react-native';

/**
 * The native date picker behind the sheet's "Started" row.
 * `@react-native-community/datetimepicker` ships no web build, so the web
 * target resolves `DateField.web.tsx` instead of this file.
 */
export function DateField({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
}) {
  return (
    <DateTimePicker
      value={value ?? new Date()}
      mode="date"
      display={Platform.OS === 'ios' ? 'inline' : 'default'}
      onChange={(_, date) => onChange(date ?? null)}
    />
  );
}
