'use client';

import { APPLICATION_STATUSES } from '@/lib/domain';
import { useTranslation } from '@/lib/i18n';
import type { Control, FieldErrors } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import { FormField } from '@/components/ui/form-field';
import { todayIso } from './schema';
import type { NewApplicationForm } from './schema';

type Props = {
  control: Control<NewApplicationForm>;
  errors: FieldErrors<NewApplicationForm>;
  isValid: boolean;
  onSubmit: (data: NewApplicationForm) => void;
  handleSubmit: (onValid: (data: NewApplicationForm) => void) => (e: React.FormEvent) => void;
};

export function NewApplicationFormView({
  control,
  errors,
  isValid,
  onSubmit,
  handleSubmit,
}: Props) {
  const { t } = useTranslation();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField<NewApplicationForm>
          control={control}
          name="company"
          label={t('portal.new.company')}
          render={({ value, onChange }) => (
            <Input
              type="text"
              placeholder={t('portal.new.company')}
              value={(value ?? '') as string}
              onChange={onChange}
            />
          )}
        />
        <FormField<NewApplicationForm>
          control={control}
          name="title"
          label={t('portal.new.titleInput', { defaultValue: 'Job title' })}
          render={({ value, onChange }) => (
            <Input
              type="text"
              placeholder={t('portal.new.titleInput', { defaultValue: 'Job title' })}
              value={(value ?? '') as string}
              onChange={onChange}
            />
          )}
        />
        <FormField<NewApplicationForm>
          control={control}
          name="status"
          label={t('portal.new.status', { defaultValue: 'Status' })}
          render={({ value, onChange, onBlur }) => (
            <Select
              id="status"
              value={(value ?? '') as string}
              onChange={onChange}
              onBlur={onBlur}
            >
              {APPLICATION_STATUSES.map(status => (
                <option key={status} value={status}>
                  {t(`portal.new.status.${status}`, { defaultValue: status })}
                </option>
              ))}
            </Select>
          )}
        />
        <FormField<NewApplicationForm>
          control={control}
          name="location"
          label={t('portal.new.location', { defaultValue: 'Location' })}
          render={({ value, onChange }) => (
            <Input
              type="text"
              placeholder={t('portal.new.location', { defaultValue: 'Location' })}
              value={(value ?? '') as string}
              onChange={onChange}
            />
          )}
        />
        <FormField<NewApplicationForm>
          control={control}
          name="jobUrl"
          label={t('portal.new.jobUrl', { defaultValue: 'Job URL' })}
          render={({ value, onChange }) => (
            <Input
              type="text"
              placeholder={t('portal.new.jobUrl', { defaultValue: 'Job URL' })}
              value={(value ?? '') as string}
              onChange={onChange}
            />
          )}
        />
        <FormField<NewApplicationForm>
          control={control}
          name="appliedAt"
          label={t('portal.new.appliedAt', { defaultValue: 'Applied at' })}
          error={
            errors.appliedAt
              ? t(errors.appliedAt.message ?? '', {
                  defaultValue: errors.appliedAt.message ?? '',
                })
              : undefined
          }
          render={({ value, onChange }) => (
            <Input
              type="date"
              placeholder={t('portal.new.appliedAt', { defaultValue: 'Applied at' })}
              value={(value ?? '') as string}
              onChange={onChange}
              max={todayIso()}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField<NewApplicationForm>
          control={control}
          name="stars"
          label={t('portal.new.stars', { defaultValue: 'Stars' })}
          render={({ value, onChange }) => (
            <StarRating
              value={(value ?? 0) as number}
              onChange={v => onChange(v)}
              aria-label={t('portal.new.stars', { defaultValue: 'Rating' })}
            />
          )}
        />
      </div>

      <FormField<NewApplicationForm>
        control={control}
        name="notes"
        label={t('portal.new.notes', { defaultValue: 'Notes' })}
        render={({ value, onChange, onBlur }) => (
          <Textarea
            placeholder={t('portal.new.notes', { defaultValue: 'Notes' })}
            value={(value ?? '') as string}
            onChange={onChange}
            onBlur={onBlur}
            rows={6}
          />
        )}
      />

      <button
        type="submit"
        disabled={!isValid}
        className="w-50 rounded-md bg-orange-900 hover:bg-orange-800 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      >
        {t('portal.new.submit', { defaultValue: 'Submit' })}
      </button>
    </form>
  );
}
