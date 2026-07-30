import type { Produto, Evento } from '../api/client';

export class NotificationService {
  private static eventMonitorInterval: number | null = null;
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
      if (permission === 'granted') {
        await this.subscribeToWebPush();
        return true;
      }
    }

    return false;
  }

  static async subscribeToWebPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn('VAPID Key não encontrada. Web Push não será ativado.');
        return;
      }

      // Função para converter VAPID base64 para Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      });

      // Envia a subscription para o backend
      const { subscribeToPush } = await import('../api/client');
      await subscribeToPush(subscription);
      console.log('Web Push ativado com sucesso!');
    } catch (e) {
      console.error('Erro ao assinar Web Push:', e);
    }
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

  // --- Aurora Reminder (Eventos) ---

  static startEventMonitor(eventos: Evento[]) {
    if (this.eventMonitorInterval) {
      window.clearInterval(this.eventMonitorInterval);
    }

    // Roda a cada 1 minuto (60000 ms)
    this.eventMonitorInterval = window.setInterval(() => {
      this.checkUpcomingEvents(eventos);
    }, 60000);

    // Checa imediatamente na primeira vez
    this.checkUpcomingEvents(eventos);
  }

  static stopEventMonitor() {
    if (this.eventMonitorInterval) {
      window.clearInterval(this.eventMonitorInterval);
      this.eventMonitorInterval = null;
    }
  }

  private static checkUpcomingEvents(eventos: Evento[]) {
    if (!this.hasPermission()) return;
    if (!Array.isArray(eventos)) return;

    const agora = new Date();
    
    eventos.forEach(evento => {
      if (!evento.data) return;
      // Pula eventos de dia inteiro que não têm 'T' (ex: "2023-10-15")
      if (!evento.data.includes('T')) return;

      const horaEvento = new Date(evento.data);
      const diffMs = horaEvento.getTime() - agora.getTime();
      
      // Ignorar eventos que já passaram
      if (diffMs < 0) return;

      const diffMinutos = Math.round(diffMs / 60000);

      // Se faltam exatamente 30 minutos (ou na janela de 1 minuto)
      if (diffMinutos === 30) {
        // Usa localStorage para garantir que não mande a mesma notificação repetida no mesmo minuto
        const notificacaoId = `notified-event-${evento.id}`;
        if (!localStorage.getItem(notificacaoId)) {
          const horaStr = horaEvento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          this.sendNotification(
            '⏰ Compromisso em 30 minutos',
            `${evento.titulo} começa às ${horaStr}`
          );
          localStorage.setItem(notificacaoId, 'true');
          
          // Limpa a flag depois de 1 hora para não poluir o localStorage
          setTimeout(() => {
            localStorage.removeItem(notificacaoId);
          }, 60 * 60 * 1000);
        }
      }
    });
  }
}
