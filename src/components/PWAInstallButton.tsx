import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const PWAInstallButton = () => {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();

  if (!canInstall || isInstalled) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={promptInstall}
      className="bg-card/90 backdrop-blur-sm border-primary/20 hover:bg-primary/10 text-primary hover:text-primary shadow-lg"
      title="Instalar aplicación"
    >
      <Download className="w-5 h-5" />
    </Button>
  );
};