import React, { useState } from 'react';
import { RadioGroup, Radio, TextField as AriaTextField, Input, Label } from 'react-aria-components';
import { Dialog, DialogHeader, DialogBody, DialogFooter, DialogCloseButton } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { notify } from '@/components/ui/toast';
import { InfoIcon } from '@/fluent/InfoIcon.jsx';
import { EyeIcon } from '@/fluent/EyeIcon.jsx';
import { EyeOffIcon } from '@/fluent/EyeOffIcon.jsx';
import { cn } from '@/lib/cn';

// Filled dot for the selected radio, hollow ring otherwise — same treatment as the menu's single-select.
function RadioDot({ isSelected }) {
  return (
    <span
      className={cn(
        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
        isSelected ? 'border-transparent bg-brand-solid-icon' : 'border-primary bg-primary',
      )}
      aria-hidden="true"
    >
      {isSelected ? <span className="size-1.5 rounded-full bg-primary" /> : null}
    </span>
  );
}

// Passphrase input with a show/hide toggle — TextField has no trailing-adornment slot, so the
// input + eye button are composed here on the same tokens TextField uses.
function PassphraseField({ label, value, onChange }) {
  const [show, setShow] = useState(false);
  return (
    <AriaTextField value={value} onChange={onChange} type={show ? 'text' : 'password'} isRequired className="flex w-full flex-col gap-1.5">
      <Label className="text-text-sm font-semibold text-secondary">
        {label}
        <span className="ml-0.5 text-error-primary">*</span>
      </Label>
      <div className="relative">
        <Input
          className="h-10 w-full rounded-md border border-primary bg-primary pr-10 pl-2.5 text-text-md font-regular text-primary shadow-xs outline-none placeholder:text-placeholder data-focused:border-brand data-focused:ring-brand"
        />
        {/* The show/hide toggle only appears once there's something to reveal (Figma). eye-off = value
            hidden (masked), eye = value shown. */}
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            className="fg-quaternary hover:fg-quaternary-hover focus-visible:ring-brand absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm outline-none"
          >
            {show ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
          </button>
        )}
      </div>
    </AriaTextField>
  );
}

// The selected card carries the brand ring halo (like any focused item), in addition to keyboard
// focus-visible; an unselected card only rings while keyboard-focused.
const OPTION_CARD =
  'cursor-pointer rounded-xl border p-4 outline-none transition-colors data-focus-visible:ring-brand';
const OPTION_CARD_SELECTED = 'border-brand ring-brand';
const OPTION_CARD_UNSELECTED = 'border-secondary';

// Export configuration flow (Figma 4213-140377): choose "Include credentials" (encrypted with a
// passphrase) or "Settings only", then Export → success toast. Prototype: no real file is written.
export default function ExportConfigModal({ onClose }) {
  const [mode, setMode] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');

  const canExport =
    mode === 'settings' || (mode === 'credentials' && passphrase.length > 0 && passphrase === confirm);

  function handleExport() {
    // Prototype: no real file is written — confirm with the same success toast the design shows.
    notify.success('Configuration exported successfully');
    onClose();
  }

  return (
    <Dialog isOpen onOpenChange={(open) => { if (!open) onClose(); }} maxWidthClassName="max-w-[420px]">
      <DialogHeader>Export</DialogHeader>
      <DialogBody className="flex flex-col gap-4">
        <p className="text-text-sm text-tertiary">
          Export your connection settings for backup or transfer to another device.
        </p>

        <RadioGroup aria-label="Export options" value={mode} onChange={setMode} className="flex flex-col gap-3">
          <Radio value="credentials" className={({ isSelected }) => cn(OPTION_CARD, isSelected ? OPTION_CARD_SELECTED : OPTION_CARD_UNSELECTED)}>
            {({ isSelected }) => (
              <>
                <div className="flex gap-3">
                  <RadioDot isSelected={isSelected} />
                  <div className="flex flex-col gap-1">
                    <span className="text-text-sm font-semibold text-primary">Include credentials</span>
                    <span className="text-text-sm text-tertiary">
                      Export connection settings and saved credentials. The export file will be encrypted and protected with a passphrase.
                    </span>
                  </div>
                </div>
                {isSelected ? (
                  <div className="mt-4 flex flex-col gap-4 pl-7">
                    <PassphraseField label="Passphrase" value={passphrase} onChange={setPassphrase} />
                    <PassphraseField label="Confirm passphrase" value={confirm} onChange={setConfirm} />
                    <div className="flex gap-2 rounded-lg border border-primary bg-brand-primary p-3">
                      <InfoIcon size={16} className="fg-brand-primary mt-0.5 shrink-0" />
                      <p className="text-text-sm text-tertiary">
                        The passphrase is not stored by MyWorkDrive. If lost or forgotten, the export file cannot be imported.
                      </p>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </Radio>

          <Radio value="settings" className={({ isSelected }) => cn(OPTION_CARD, isSelected ? OPTION_CARD_SELECTED : OPTION_CARD_UNSELECTED)}>
            {({ isSelected }) => (
              <div className="flex gap-3">
                <RadioDot isSelected={isSelected} />
                <div className="flex flex-col gap-1">
                  <span className="text-text-sm font-semibold text-primary">Settings only</span>
                  <span className="text-text-sm text-tertiary">
                    Export connection settings without credentials. Credentials must be re-entered after import.
                  </span>
                </div>
              </div>
            )}
          </Radio>
        </RadioGroup>
      </DialogBody>
      <DialogFooter fullWidth>
        <DialogCloseButton label="Cancel" />
        <Button variant="primary" isDisabled={!canExport} onPress={handleExport}>Export</Button>
      </DialogFooter>
    </Dialog>
  );
}
