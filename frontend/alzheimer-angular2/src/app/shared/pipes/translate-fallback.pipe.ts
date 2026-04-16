import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'translate',
  standalone: true,
})
export class TranslateFallbackPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return value ?? '';
  }
}
