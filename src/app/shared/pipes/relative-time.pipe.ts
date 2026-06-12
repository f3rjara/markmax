import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe puro que transforma un timestamp en milisegundos
 * a una cadena de tiempo relativo en español.
 */
@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  /**
   * Transforma un timestamp a texto relativo (ej: "hace 2 minutos").
   * @param timestamp Timestamp en milisegundos, o null/undefined.
   */
  transform(timestamp: number | null | undefined): string {
    if (timestamp == null) {
      return '';
    }
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) {
      return 'hace unos segundos';
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    const days = Math.floor(hours / 24);
    return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
  }
}
