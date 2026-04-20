import { Injectable } from '@angular/core';
import { MissingTranslationHandler, MissingTranslationHandlerParams } from '@ngx-translate/core';

@Injectable()
export class AppMissingTranslationHandler implements MissingTranslationHandler {
  handle(params: MissingTranslationHandlerParams): string {
    const key = params.key || '';
    const tail = key.split('.').pop() || key;
    const words = tail
      .replace(/[_-]+/g, ' ')
      .toLowerCase()
      .trim();

    return words.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
