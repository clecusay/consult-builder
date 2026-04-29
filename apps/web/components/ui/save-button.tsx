'use client';

import { useState } from 'react';
import { Loader2, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SaveButtonProps {
  onSave: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function SaveButton({ onSave, disabled, className }: SaveButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleClick() {
    setSaving(true);
    setSaved(false);
    try {
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={saving || disabled} className={className}>
      {saving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : saved ? (
        <Check className="h-4 w-4" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
    </Button>
  );
}
