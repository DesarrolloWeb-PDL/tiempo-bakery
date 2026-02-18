import { DateTime } from 'luxon';

export interface TimeGatingConfig {
  timezone: string;
  openingDay: number; // 0=Domingo, 1=Lunes, ..., 3=Miércoles
  openingHour: number;
  openingMinute: number;
  closingDay: number;
  closingHour: number;
  closingMinute: number;
}

export const DEFAULT_CONFIG: TimeGatingConfig = {
  timezone: 'Europe/Madrid',
  openingDay: 3, // Miércoles
  openingHour: 18,
  openingMinute: 0,
  closingDay: 0, // Domingo
  closingHour: 20,
  closingMinute: 0,
};

export class TimeGatingService {
  private config: TimeGatingConfig;

  constructor(config: TimeGatingConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Verifica si el sitio está abierto para pedidos
   */
  isOpen(now?: DateTime): boolean {
    const currentTime = now || DateTime.now().setZone(this.config.timezone);
    
    const weekStart = currentTime.startOf('week'); // Lunes 00:00
    
    // Calcular tiempo de apertura (Miércoles 18:00)
    const openingTime = weekStart.plus({ 
      days: this.config.openingDay - 1, // Ajuste porque startOf('week') es lunes
      hours: this.config.openingHour,
      minutes: this.config.openingMinute 
    });
    
    // Calcular tiempo de cierre (Domingo 20:00)
    const closingTime = weekStart.plus({ 
      days: this.config.closingDay + 6, // Domingo de la semana actual
      hours: this.config.closingHour,
      minutes: this.config.closingMinute 
    });
    
    return currentTime >= openingTime && currentTime <= closingTime;
  }

  /**
   * Obtiene el tiempo restante hasta la próxima apertura
   */
  getTimeUntilOpening(now?: DateTime): {
    isOpen: boolean;
    nextOpening: DateTime | null;
    remainingMs: number | null;
  } {
    const currentTime = now || DateTime.now().setZone(this.config.timezone);
    const isCurrentlyOpen = this.isOpen(currentTime);

    if (isCurrentlyOpen) {
      return {
        isOpen: true,
        nextOpening: null,
        remainingMs: null,
      };
    }

    // Calcular próxima apertura
    const weekStart = currentTime.startOf('week');
    let nextOpening = weekStart.plus({ 
      days: this.config.openingDay - 1,
      hours: this.config.openingHour,
      minutes: this.config.openingMinute 
    });

    // Si ya pasó la apertura de esta semana, calcular la siguiente
    if (nextOpening <= currentTime) {
      nextOpening = nextOpening.plus({ weeks: 1 });
    }

    return {
      isOpen: false,
      nextOpening,
      remainingMs: nextOpening.diff(currentTime).milliseconds,
    };
  }

  /**
   * Obtiene el ID de la semana actual (formato ISO: YYYY-Www)
   */
  getCurrentWeekId(now?: DateTime): string {
    const currentTime = now || DateTime.now().setZone(this.config.timezone);
    return currentTime.toFormat('kkkk-\'W\'WW'); // ej: "2025-W45"
  }

  /**
   * Formatea el tiempo restante de manera legible
   */
  formatTimeRemaining(ms: number): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const hours = Math.floor((ms / 1000 / 60 / 60) % 24);
    const days = Math.floor(ms / 1000 / 60 / 60 / 24);

    return { days, hours, minutes, seconds };
  }

  /**
   * Obtiene el tiempo hasta el cierre
   */
  getTimeUntilClosing(now?: DateTime): {
    isClosed: boolean;
    nextClosing: DateTime | null;
    remainingMs: number | null;
  } {
    const currentTime = now || DateTime.now().setZone(this.config.timezone);
    const isCurrentlyOpen = this.isOpen(currentTime);

    if (!isCurrentlyOpen) {
      return {
        isClosed: true,
        nextClosing: null,
        remainingMs: null,
      };
    }

    // Calcular cierre de esta semana
    const weekStart = currentTime.startOf('week');
    const closingTime = weekStart.plus({ 
      days: this.config.closingDay + 6,
      hours: this.config.closingHour,
      minutes: this.config.closingMinute 
    });

    return {
      isClosed: false,
      nextClosing: closingTime,
      remainingMs: closingTime.diff(currentTime).milliseconds,
    };
  }
}

export const timeGating = new TimeGatingService();
