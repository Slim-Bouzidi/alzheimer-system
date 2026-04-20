import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'translateFallback',
  standalone: true,
})
export class TranslateFallbackPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ?? '';
  }
}
