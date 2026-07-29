import type { Produto } from '../api/client';

export class NotificationService {
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador não suporta notificações de desktop.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  static hasPermission(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  static async checkExpirations(produtos: Produto[]) {
    if (!this.hasPermission()) return;

    // Verificar se já notificamos hoje para não fazer spam
    const lastNotified = localStorage.getItem('aurora-last-notified');
    const today = new Date().toDateString();
    if (lastNotified === today) {
      return; // Já notificou hoje
    }

    const expirando = produtos.filter(p => {
      if (!p.validade) return false;
      const validade = new Date(p.validade);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0); // Zera as horas para comparar só os dias
      
      const diffTime = validade.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Vencem em 3 dias ou menos, ou já estão vencidos
      return diffDays <= 3 && (p.quantidade ?? 0) > 0;
    });

    if (expirando.length > 0) {
      const vencidos = expirando.filter(p => new Date(p.validade!) < new Date(new Date().setHours(0,0,0,0)));
      const quaseVencendo = expirando.filter(p => !vencidos.includes(p));

      let title = '⚠️ Alerta de Vencimento';
      let body = '';

      if (vencidos.length > 0) {
        body += `${vencidos.length} produto(s) já venceram! `;
      }
      if (quaseVencendo.length > 0) {
        body += `${quaseVencendo.length} produto(s) vencem em breve.`;
      }

      await this.sendNotification(title, body);
      localStorage.setItem('aurora-last-notified', today);
    }
  }

  private static async sendNotification(title: string, body: string) {
    try {
      // Tentar usar o Service Worker para garantir notificação nativa no PWA Android
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          body,
          icon: '/pwa-192x192.png',
          tag: 'aurora-vencimentos',
        });
      } else {
        // Fallback padrão do navegador
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
        });
      }
    } catch (e) {
      console.error('Erro ao enviar notificação:', e);
      // Fallback
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
      });
    }
  }
}
