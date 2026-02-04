export function Input({
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  min,
  max,
  'aria-invalid': ariaInvalid,
}: {
  type: string;
  placeholder: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  min?: string;
  max?: string;
  'aria-invalid'?: boolean;
}) {
  const inputClassName = [
    'w-full rounded-md border border-gray-300',
    'text-gray-900 placeholder:text-gray-500',
    'px-3 py-2 text-sm',
    'focus:border-orange-700 focus:ring-orange-100 focus:outline-none focus:ring-2',
    'aria-[invalid=true]:border-red-500',
  ].join(' ');

  return (
    <input
      className={inputClassName}
      type={type}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      min={min}
      max={max}
      aria-invalid={ariaInvalid}
    />
  );
}
