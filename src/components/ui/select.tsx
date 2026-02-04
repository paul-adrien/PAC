export function Select({
  id,
  value,
  onChange,
  onBlur,
  children,
  'aria-invalid': ariaInvalid,
}: {
  id?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  'aria-invalid'?: boolean;
}) {
  const selectClassName = [
    'w-full rounded-md border border-gray-300 bg-white',
    'text-gray-900 placeholder:text-gray-500 px-3 py-2 pr-9 text-sm',
    'focus:border-orange-700 focus:ring-orange-100 focus:outline-none focus:ring-2',
    'cursor-pointer appearance-none bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat',
    'aria-[invalid=true]:border-red-500',
  ].join(' ');

  return (
    <select
      id={id}
      className={selectClassName}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      aria-invalid={ariaInvalid}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
      }}
    >
      {children}
    </select>
  );
}
