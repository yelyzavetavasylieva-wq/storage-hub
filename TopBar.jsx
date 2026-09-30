import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MenuTrigger, Menu, Popover } from '@/components/ui/menu';
import { MenuItem as AriaMenuItem } from 'react-aria-components';
import { BrandLogo } from '@/logos.jsx';
import { FlagGB, FlagDE, FlagFR, FlagPT, FlagSE, FlagNL, FlagES } from '@/Flags.jsx';
import { ChevronDownIcon } from '@/fluent/ChevronDownIcon.jsx';
import CheckIcon from '@/assets/icons/check.svg?react';

// Languages offered by the switcher — order + flags per Figma 2277-162850.
const LANGUAGES = [
  { code: 'en', name: 'English', Flag: FlagGB },
  { code: 'de', name: 'German', Flag: FlagDE },
  { code: 'fr', name: 'French', Flag: FlagFR },
  { code: 'pt', name: 'Portuguese', Flag: FlagPT },
  { code: 'sv', name: 'Swedish', Flag: FlagSE },
  { code: 'nl', name: 'Dutch', Flag: FlagNL },
  { code: 'es', name: 'Spanish', Flag: FlagES },
];

// Flags are drawn at their native 20×15 footprint (Flags.jsx) — no square wrapper that would stretch them.
function FlagMark({ Flag }) {
  return <span className="flex shrink-0 items-center [&>svg]:block"><Flag /></span>;
}

// Shared top bar: MyWorkDrive brand logo + language switcher. The switcher is a menu; picking a
// language updates the shown flag/label (prototype: no real i18n behind it).
export default function TopBar() {
  const [lang, setLang] = useState('en');
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Full-bleed bar with a 32px inner gutter (px-8) — content sits at the same 32px edge as the page body.
  return (
    <header className="flex items-center justify-between border-b border-secondary bg-primary px-4 py-4 sm:px-8">
        <BrandLogo className="block h-7 w-auto" />
        <MenuTrigger>
          <Button variant="secondary" className="group">
            <FlagMark Flag={current.Flag} />
            <span>{current.name}</span>
            {/* Chevron flips up while the menu is open (trigger gets aria-expanded). */}
            <ChevronDownIcon size={16} className="transition-transform group-aria-expanded:rotate-180" />
          </Button>
          <Popover className="w-60" placement="bottom end">
            <Menu
              aria-label="Select language"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[lang]}
              onSelectionChange={(keys) => {
                const next = [...keys][0];
                if (next) setLang(String(next));
              }}
            >
              {LANGUAGES.map((l) => (
                <AriaMenuItem
                  key={l.code}
                  id={l.code}
                  textValue={l.name}
                  className="flex h-10 cursor-pointer items-center justify-between gap-2 py-2 pr-3 pl-4 text-text-sm font-regular text-primary outline-none select-none data-focus-visible:bg-primary-hover data-hovered:bg-primary-hover"
                >
                  {({ isSelected }) => (
                    <>
                      <span className="flex min-w-0 items-center gap-2">
                        <FlagMark Flag={l.Flag} />
                        <span className="truncate">{l.name}</span>
                      </span>
                      {isSelected ? (
                        <CheckIcon className="size-4 shrink-0 stroke-current fg-brand-primary" fill="none" strokeWidth={2} aria-hidden="true" />
                      ) : null}
                    </>
                  )}
                </AriaMenuItem>
              ))}
            </Menu>
          </Popover>
        </MenuTrigger>
    </header>
  );
}
