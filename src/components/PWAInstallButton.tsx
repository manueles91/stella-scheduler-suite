import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const PWAInstallButton = () => {
  const { canInstall, promptInstall } = usePWAInstall();

  if (!canInstall) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={promptInstall}
      className="hidden sm:flex items-center gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary hover:text-primary"
    >
      <Download className="w-4 h-4" />
      Instalar App
    </Button>
  );
};