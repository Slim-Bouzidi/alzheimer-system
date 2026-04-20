import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'translateFallback',
  standalone: true,
  pure: false
})
export class TranslateFallbackPipe implements PipeTransform {
  constructor(private translate: TranslateService) {}

  transform(key: string, fallback: string = key): string {
    const translated = this.translate.instant(key);
    return translated === key ? fallback : translated;
  }
}
