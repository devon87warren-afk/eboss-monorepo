'use client';

import { BottomNav } from '@/components/navigation/BottomNav';
import { useConfig } from '@/hooks/useConfig';
// TODO(EBOSS-111, 2026-03-08): ConfigSetting imported for future typed usage;
// suppress unused-vars warning until the config page rendering is complete.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { ConfigSetting, ConfigToggle, ConfigNumber, ConfigText } from '@/types/dashboard';

export default function ConfigPage() {
  const { sections, asset, hasChanges, updateSetting, saveChanges } = useConfig();

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center bg-[#09090b]/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-white/10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-white/40 text-sm">
              settings_input_component
            </span>
            <h2 className="text-white text-sm font-bold uppercase tracking-widest">
              System Config
            </h2>
          </div>
          <p className="text-[10px] text-white/40 font-mono mt-0.5">
            TARGET: {asset.name} • ADMIN MODE
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-white/60 font-medium">EDITING</span>
            <span className="text-xs text-white font-bold font-mono text-orange-400">
              UNLOCKED
            </span>
          </div>
          <button
            onClick={saveChanges}
            className={`flex items-center justify-center size-8 ${
              hasChanges
                ? 'bg-red-500/20 border-red-500/40 text-red-500 hover:bg-red-500 hover:text-white'
                : 'bg-red-500/10 border-red-500/20 text-red-500/50'
            } border rounded transition-colors`}
          >
            <span className="material-symbols-outlined text-lg">save</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col pb-32 space-y-6">
        {sections.map((section) => (
          <section key={section.id} className="mt-4 px-4">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="material-symbols-outlined text-red-500 text-sm">
                {section.icon}
              </span>
              <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">
                {section.title}
              </h3>
            </div>

            <div className="bg-[#121214] border border-white/10 rounded-lg overflow-hidden">
              {section.settings.map((setting, index) => (
                <div
                  key={setting.id}
                  className={`${index > 0 ? 'border-t border-white/5' : ''} ${
                    setting.id === 'remote-access' ? 'bg-red-500/5' : ''
                  }`}
                >
                  {setting.type === 'toggle' && (
                    <ToggleSetting
                      setting={setting as ConfigToggle}
                      onUpdate={(value) => updateSetting(section.id, setting.id, value)}
                    />
                  )}
                  {setting.type === 'number' && (
                    <NumberSetting
                      setting={setting as ConfigNumber}
                      onUpdate={(value) => updateSetting(section.id, setting.id, value)}
                    />
                  )}
                  {setting.type === 'text' && (
                    <TextSetting setting={setting as ConfigText} />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Danger Zone */}
        <section className="px-4">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
            <h3 className="text-xs font-bold text-red-500/70 uppercase tracking-wider">
              Danger Zone
            </h3>
          </div>

          <div className="bg-[#121214] border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-red-500">Factory Reset</h4>
                <p className="text-[10px] text-red-500/50 mt-1 font-mono">
                  IRREVERSIBLE • REQUIRES PHYSICAL CONFIRMATION
                </p>
              </div>
              <button
                disabled
                className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded text-red-500/50 text-xs font-bold uppercase tracking-wide cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Spacer for bottom nav */}
      <div className="h-8 bg-transparent"></div>
    </div>
  );
}

// Toggle Setting Component
function ToggleSetting({
  setting,
  onUpdate,
}: {
  setting: ConfigToggle;
  onUpdate: (value: boolean) => void;
}) {
  const isRiskSetting = setting.id === 'remote-access';

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{setting.label}</span>
          {isRiskSetting && (
            <span className="px-1 py-0.5 rounded bg-red-500/20 text-red-500 text-[8px] font-bold border border-red-500/20">
              RISK
            </span>
          )}
        </div>
        <span className="text-[10px] text-white/40 font-mono">{setting.description}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={setting.value}
          onChange={(e) => onUpdate(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 hover:bg-white/20"></div>
      </label>
    </div>
  );
}

// Number Setting Component
function NumberSetting({
  setting,
  onUpdate,
}: {
  setting: ConfigNumber;
  onUpdate: (value: number) => void;
}) {
  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">{setting.label}</span>
        <span className="text-[10px] text-white/40 font-mono">{setting.description}</span>
      </div>
      <div className="w-24 relative">
        <input
          type="number"
          value={setting.value}
          onChange={(e) => onUpdate(parseFloat(e.target.value) || 0)}
          className="w-full bg-[#09090b] border border-white/10 rounded px-2 py-1.5 text-right text-sm font-mono text-white focus:border-red-500 focus:ring-0"
        />
        <span className="absolute left-2 top-1.5 text-white/20 text-xs pointer-events-none">
          {setting.unit}
        </span>
      </div>
    </div>
  );
}

// Text Setting Component
function TextSetting({ setting }: { setting: ConfigText }) {
  return (
    <div className="p-4">
      <label className="text-xs font-bold text-white block mb-2">{setting.label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={setting.id === 'auth-key' ? 'password' : 'text'}
            value={setting.value}
            readOnly={setting.readonly}
            className="w-full bg-[#09090b] border border-white/10 rounded p-2.5 text-white/60 font-mono text-sm tracking-widest focus:outline-none cursor-not-allowed"
          />
          {setting.id === 'auth-key' && (
            <span className="absolute right-3 top-2.5 material-symbols-outlined text-white/30 text-sm">
              visibility_off
            </span>
          )}
        </div>
        <button className="px-3 bg-white/5 border border-white/10 rounded hover:bg-white/10 transition-colors">
          <span className="material-symbols-outlined text-white text-lg">content_copy</span>
        </button>
      </div>
    </div>
  );
}
