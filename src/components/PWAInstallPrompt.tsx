import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useIsMobile } from '@/hooks/use-mobile';

export const PWAInstallPrompt = () => {
  const { canInstall, promptInstall } = usePWAInstall();
  const isMobile = useIsMobile();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show prompt after a delay to avoid interrupting initial page load
    const timer = setTimeout(() => {
      if (canInstall && !isDismissed) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [canInstall, isDismissed]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!canInstall || isDismissed || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Mobile Banner */}
      {isMobile ? (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
          <Card className="bg-card/95 backdrop-blur-sm border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    Instalar Stella Studio
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Accede más rápido desde tu pantalla de inicio
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleInstall}
                      className="flex-1"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Instalar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleDismiss}
                      className="px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Desktop Notification */
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <Card className="bg-card/95 backdrop-blur-sm border-primary/20 w-80">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground">
                      Instalar aplicación
                    </h3>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={handleDismiss}
                      className="p-0 h-auto w-auto"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Instala Stella Studio para un acceso más rápido y una mejor experiencia
                  </p>
                  <Button 
                    size="sm" 
                    onClick={handleInstall}
                    className="w-full"
                  >
                    <Download className="w-3 h-3 mr-2" />
                    Instalar ahora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};