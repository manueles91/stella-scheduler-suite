import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Gift, Sparkles, RefreshCw } from 'lucide-react';
import { useLoyalty } from '@/hooks/useLoyalty';
import { cn } from '@/lib/utils';

interface CustomerLoyaltyCardProps {
  effectiveUserId?: string;
}

export const CustomerLoyaltyCard = ({ effectiveUserId }: CustomerLoyaltyCardProps) => {
  const {
    loading,
    loyaltyProgress,
    rewardTiers,
    programConfig,
    getAvailableRewards,
    getNextReward,
    refetchProgress
  } = useLoyalty(effectiveUserId);


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Cargando tu tarjeta...</p>
        </div>
      </div>
    );
  }

  if (!loyaltyProgress) {
    return (
      <div className="text-center p-8 space-y-4">
        <Award className="h-12 w-12 mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-medium">Tu Tarjeta de Lealtad</h3>
          <p className="text-muted-foreground">
            No se pudo cargar tu información de lealtad
          </p>
          <Button onClick={refetchProgress} className="mt-4">
            Intentar nuevamente
          </Button>
        </div>
      </div>
    );
  }

  const availableRewards = getAvailableRewards(loyaltyProgress.total_visits);
  const nextReward = getNextReward(loyaltyProgress.total_visits);
  const visitsRemaining = nextReward 
    ? nextReward.visits_required - loyaltyProgress.total_visits
    : 0;

  // Create punch card grid (10 holes per card)
  const maxVisitsPerCard = 10;
  const totalPunchHoles = Math.max(maxVisitsPerCard, Math.max(...rewardTiers.map(t => t.visits_required), loyaltyProgress.total_visits));
  const punchHoles = Array.from({ length: totalPunchHoles }, (_, i) => i < loyaltyProgress.total_visits);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mi Tarjeta</h2>
        <p className="text-muted-foreground">
          Tu progreso en el programa de lealtad
        </p>
      </div>

      {/* Punch Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
        <CardHeader className="text-center space-y-4 bg-gradient-to-r from-amber-100 to-orange-100">
          <CardTitle className="flex items-center justify-center gap-2 text-amber-800">
            <Sparkles className="h-6 w-6" />
            {programConfig?.program_name || 'Programa de Lealtad'}
          </CardTitle>
          
          <div className="space-y-2">
            <div className="text-3xl font-bold text-amber-700">
              {loyaltyProgress.total_visits}
            </div>
            <p className="text-sm text-amber-600">
              {loyaltyProgress.total_visits === 1 ? 'visita registrada' : 'visitas registradas'}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Punch Card Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-4 justify-items-center">
              {punchHoles.map((isPunched, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-12 h-12 rounded-full border-4 flex items-center justify-center text-sm font-bold transition-all duration-300",
                    isPunched
                      ? "bg-amber-400 border-amber-600 text-amber-800 shadow-lg transform scale-105"
                      : "bg-white border-amber-300 text-amber-300 shadow-inner"
                  )}
                >
                  {isPunched ? "✓" : index + 1}
                </div>
              ))}
            </div>
            
            {/* Progress message */}
            {nextReward && (
              <div className="text-center p-3 bg-amber-100 rounded-lg">
                <p className="text-sm font-medium text-amber-800">
                  {visitsRemaining === 1 
                    ? `¡Solo necesitas 1 visita más para ${nextReward.reward_title}!`
                    : `Necesitas ${visitsRemaining} visitas más para ${nextReward.reward_title}`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Visit tracking info */}
          <div className="text-center space-y-3">
            <div className="p-4 bg-white rounded-lg shadow-sm border-2 border-amber-200">
              <Award className="w-16 h-16 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-amber-800">
                Visitas se registran automáticamente
              </p>
            </div>
            <p className="text-xs text-amber-700 max-w-xs mx-auto font-medium">
              Tus visitas se marcan automáticamente cuando completas una cita
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Available Rewards */}
      {availableRewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Recompensas Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-green-800">{reward.reward_title}</p>
                    {reward.reward_description && (
                      <p className="text-sm text-green-600">{reward.reward_description}</p>
                    )}
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    ¡Disponible!
                  </Badge>
                </div>
              ))}
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 Menciona estas recompensas al hacer tu próxima cita
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Reward Tiers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Niveles de Recompensas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rewardTiers.map((tier) => {
              const isUnlocked = loyaltyProgress.total_visits >= tier.visits_required;
              const isCurrent = nextReward?.id === tier.id;
              
              return (
                <div
                  key={tier.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    isUnlocked 
                      ? "bg-green-50 border-green-200" 
                      : isCurrent 
                        ? "bg-orange-50 border-orange-200"
                        : "bg-muted/30 border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      isUnlocked 
                        ? "bg-green-500 text-white" 
                        : isCurrent
                          ? "bg-orange-500 text-white"
                          : "bg-muted text-muted-foreground"
                    )}>
                      {isUnlocked ? '✓' : tier.visits_required}
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium",
                        isUnlocked ? "text-green-800" : isCurrent ? "text-orange-800" : ""
                      )}>
                        {tier.reward_title}
                      </p>
                      <p className={cn(
                        "text-sm",
                        isUnlocked ? "text-green-600" : isCurrent ? "text-orange-600" : "text-muted-foreground"
                      )}>
                        {tier.visits_required} visitas
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    {tier.is_free_service ? (
                      <Badge className={isUnlocked ? "bg-green-100 text-green-800" : ""}>
                        Gratis
                      </Badge>
                    ) : (
                      <Badge 
                        variant={isUnlocked ? "default" : "secondary"}
                        className={isUnlocked ? "bg-green-100 text-green-800" : ""}
                      >
                        {tier.discount_percentage}%
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};