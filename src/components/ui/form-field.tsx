'use client';

import {
  type Control,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  Controller,
} from 'react-hook-form';

type FormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  render: (field: ControllerRenderProps<T, FieldPath<T>>) => React.ReactNode;
  error?: string;
  id?: string;
};

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  render,
  error,
  id = String(name),
}: FormFieldProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => render(field) as React.ReactElement}
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
