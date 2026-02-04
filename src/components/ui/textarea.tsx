export function Textarea({
  placeholder,
  value,
  onChange,
  onBlur,
  rows = 4,
  'aria-invalid': ariaInvalid,
}: {
  placeholder: string;
  value?: string | null;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  'aria-invalid'?: boolean;
}) {
  const textareaClassName = [
    'w-full rounded-md border border-gray-300',
    'text-gray-900 placeholder:text-gray-500',
    'px-3 py-2 text-sm resize-y min-h-[6rem]',
    'focus:border-orange-700 focus:ring-orange-100 focus:outline-none focus:ring-2',
    'aria-[invalid=true]:border-red-500',
  ].join(' ');

  return (
    <textarea
      className={textareaClassName}
      placeholder={placeholder}
      value={value ?? ''}
      onChange={onChange}
      onBlur={onBlur}
      rows={rows}
      aria-invalid={ariaInvalid}
    />
  );
}
