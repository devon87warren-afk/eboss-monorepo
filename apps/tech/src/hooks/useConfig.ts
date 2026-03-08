'use client';

import { useState, useCallback } from 'react';
import { configSections, currentAsset } from '@/lib/mock-data';
import type { ConfigSection, ConfigSetting, Asset } from '@/types/dashboard';

interface UseConfigReturn {
  sections: ConfigSection[];
  asset: Asset;
  isEditing: boolean;
  hasChanges: boolean;
  updateSetting: (sectionId: string, settingId: string, value: boolean | number | string) => void;
  saveChanges: () => void;
  discardChanges: () => void;
}

// TODO(EBOSS-111, 2026-03-08): assetId param reserved for future multi-asset
// config support; suppress until the feature is implemented.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useConfig(assetId?: string): UseConfigReturn {
  const [sections, setSections] = useState<ConfigSection[]>(configSections);
  const [originalSections] = useState<ConfigSection[]>(configSections);
  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = useCallback(
    (sectionId: string, settingId: string, value: boolean | number | string) => {
      setSections((prev) =>
        prev.map((section) => {
          if (section.id !== sectionId) return section;

          return {
            ...section,
            settings: section.settings.map((setting) => {
              if (setting.id !== settingId) return setting;
              return { ...setting, value } as ConfigSetting;
            }),
          };
        })
      );
      setHasChanges(true);
    },
    []
  );

  const saveChanges = useCallback(() => {
    // In a real app, this would send to an API
    console.log('Saving config changes:', sections);
    setHasChanges(false);
  }, [sections]);

  const discardChanges = useCallback(() => {
    setSections(originalSections);
    setHasChanges(false);
  }, [originalSections]);

  return {
    sections,
    asset: currentAsset,
    isEditing: true, // Always in edit mode for this demo
    hasChanges,
    updateSetting,
    saveChanges,
    discardChanges,
  };
}
