import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, QrCode, UserCheck, Award, Plus } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useLoyalty, CustomerLoyaltyProgress } from '@/hooks/useLoyalty';
import { toast } from 'sonner';

export const AdminLoyaltyScanner = () => {
  const {
    loading,
    rewardTiers,
    programConfig,
    addVisitToCustomer,
    findCustomerByQR,
    getAvailableRewards,
    getNextReward
  } = useLoyalty();

  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLoyaltyProgress | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerElementId = 'qr-scanner-container';

  // Initialize QR scanner
  const startScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    const scanner = new Html5QrcodeScanner(
      scannerElementId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    scanner.render(
      async (decodedText: string) => {
        await handleQRScan(decodedText);
        stopScanner();
      },
      (error: any) => {
        // Silently handle scan errors - they're normal during scanning
        console.debug('QR scan error:', error);
      }
    );

    scannerRef.current = scanner;
    setIsScanning(true);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  // Handle QR code scan
  const handleQRScan = async (qrToken: string) => {
    try {
      const customer = await findCustomerByQR(qrToken);
      if (customer) {
        setSelectedCustomer(customer);
        setShowConfirmDialog(true);
      } else {
        toast.error('Cliente no encontrado con este código QR');
      }
    } catch (error) {
      console.error('Error processing QR:', error);
      toast.error('Error procesando código QR');
    }
  };

  // Handle manual code entry
  const handleManualEntry = async () => {
    if (!manualCode.trim()) {
      toast.error('Ingresa un código QR válido');
      return;
    }

    await handleQRScan(manualCode.trim());
  };

  // Confirm and add visit
  const confirmAddVisit = async () => {
    if (!selectedCustomer) return;

    const success = await addVisitToCustomer(selectedCustomer.qr_code_token, notes);
    if (success) {
      setShowConfirmDialog(false);
      setSelectedCustomer(null);
      setNotes('');
      setManualCode('');
      
      // Refresh customer data
      const updatedCustomer = await findCustomerByQR(selectedCustomer.qr_code_token);
      if (updatedCustomer) {
        setSelectedCustomer(updatedCustomer);
      }
    }
  };

  // Get progress percentage for next reward
  const getProgressToNextReward = (customer: CustomerLoyaltyProgress) => {
    const nextReward = getNextReward(customer.total_visits);
    if (!nextReward) return 100; // All rewards unlocked
    
    return Math.min((customer.total_visits / nextReward.visits_required) * 100, 100);
  };

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Marcar Visitas</h2>
        <p className="text-muted-foreground">
          Escanea el código QR de los clientes para registrar sus visitas
        </p>
      </div>

      {programConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {programConfig.program_name}
            </CardTitle>
            {programConfig.description && (
              <CardDescription>{programConfig.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rewardTiers.map((tier) => (
                <div key={tier.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{tier.reward_title}</p>
                    <p className="text-sm text-muted-foreground">
                      {tier.visits_required} visitas
                    </p>
                  </div>
                  {tier.is_free_service ? (
                    <Badge>Gratis</Badge>
                  ) : (
                    <Badge variant="secondary">{tier.discount_percentage}%</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Escáner QR
            </CardTitle>
            <CardDescription>
              Escanea el código QR del cliente para agregar una visita
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {!isScanning ? (
                <Button onClick={startScanner} className="w-full">
                  <Camera className="h-4 w-4 mr-2" />
                  Iniciar Escáner
                </Button>
              ) : (
                <Button onClick={stopScanner} variant="outline" className="w-full">
                  Detener Escáner
                </Button>
              )}
              
              <div id={scannerElementId} className="w-full" />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="manual-code">Ingreso Manual de Código</Label>
              <div className="flex gap-2">
                <Input
                  id="manual-code"
                  placeholder="Ingresa el código QR"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
                <Button onClick={handleManualEntry} disabled={loading}>
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Agrega notas sobre la visita..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Instrucciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Solicita el código QR</p>
                  <p className="text-sm text-muted-foreground">
                    Pide al cliente que muestre su código QR desde "Mi Tarjeta"
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Escanea o ingresa</p>
                  <p className="text-sm text-muted-foreground">
                    Usa la cámara para escanear o ingresa el código manualmente
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Confirma la visita</p>
                  <p className="text-sm text-muted-foreground">
                    Verifica los datos del cliente y confirma para agregar la visita
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">💡 Consejos:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Asegúrate de tener buena iluminación</li>
                <li>• Mantén el código QR centrado en la cámara</li>
                <li>• Usa ingreso manual si hay problemas con la cámara</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Confirmar Visita
            </DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Cliente:</span>
                  <span>{selectedCustomer.customer?.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email:</span>
                  <span className="text-sm">{selectedCustomer.customer?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Visitas actuales:</span>
                  <Badge variant="secondary">{selectedCustomer.total_visits}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Después de esta visita:</span>
                  <Badge>{selectedCustomer.total_visits + 1}</Badge>
                </div>
              </div>

              {/* Show available rewards */}
              {selectedCustomer && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Recompensas disponibles:</p>
                  <div className="space-y-1">
                    {getAvailableRewards(selectedCustomer.total_visits + 1).map((reward) => (
                      <div key={reward.id} className="text-xs p-2 bg-green-50 border border-green-200 rounded text-green-700">
                        ✓ {reward.reward_title}
                      </div>
                    ))}
                    
                    {getNextReward(selectedCustomer.total_visits + 1) && (
                      <div className="text-xs p-2 bg-orange-50 border border-orange-200 rounded text-orange-700">
                        Próxima: {getNextReward(selectedCustomer.total_visits + 1)?.reward_title} 
                        ({getNextReward(selectedCustomer.total_visits + 1)?.visits_required} visitas)
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={() => setShowConfirmDialog(false)} 
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={confirmAddVisit}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Agregando...' : 'Confirmar Visita'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};