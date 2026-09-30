import React, { useState } from 'react';
import { TextField } from '@/components/ui/text-field';
import { Select, SelectItem } from '@/components/ui/select';
import { EyeIcon } from '@/fluent/EyeIcon.jsx';
import { EyeOffIcon } from '@/fluent/EyeOffIcon.jsx';
import { cn } from '@/lib/cn';
import { storageFieldsFor } from './storageSettings.js';

const fieldWidth = (f) => (f.width === 'small' ? 'w-40' : 'w-full sm:w-1/2');

const Divider = () => <div className="border-t border-secondary" />;

function FieldLabel({ children, isRequired }) {
  return (
    <label className="text-text-sm font-semibold text-secondary">
      {children}
      {isRequired && <span className="ml-0.5 text-error-primary">*</span>}
    </label>
  );
}

function PasswordField({ label, hint, value, onChange, isRequired, className }) {
  const [show, setShow] = useState(false);
  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      <div className="relative">
        <input
          className="h-10 w-full rounded-md border border-primary bg-primary pr-11 pl-2.5 text-text-md text-primary shadow-xs outline-none focus:border-brand focus:ring-brand"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="fg-quaternary absolute top-1/2 right-2.5 -translate-y-1/2 hover:fg-secondary" aria-label={show ? 'Hide' : 'Show'} onClick={() => setShow((s) => !s)}>
          {show ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
        </button>
      </div>
      {hint && <span className="text-text-sm text-tertiary">{hint}</span>}
    </div>
  );
}

// Renders a schema field list (the provider's Storage Settings by default, or any `fields` — e.g. its
// saved-credential Authentication fields) against a flat `values` object. `onChange(key, val)`
// updates a single field. Shared by the Add-connection wizard and the Edit-connection page.
export function StorageSettingsFields({ providerId, fields, values, onChange }) {
  return (
    <>
      {(fields || storageFieldsFor(providerId)).map((f) => (
        <React.Fragment key={f.key}>
          {f.dividerBefore && <Divider />}
          {f.type === 'select' ? (
            <Select label={f.label} description={f.hint} isRequired={f.required} className={fieldWidth(f)} selectedKey={values[f.key]} onSelectionChange={(k) => onChange(f.key, String(k))}>
              {f.options.map((o) => <SelectItem key={o} id={o}>{o}</SelectItem>)}
            </Select>
          ) : f.type === 'password' ? (
            <PasswordField label={f.label} hint={f.hint} isRequired={f.required} className={fieldWidth(f)} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
          ) : (
            <TextField label={f.label} description={f.hint} isRequired={f.required} className={fieldWidth(f)} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
          )}
        </React.Fragment>
      ))}
    </>
  );
}
