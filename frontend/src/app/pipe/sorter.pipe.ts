import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'sorter',
    pure: true,
    standalone: true
})
export class SorterPipe implements PipeTransform {
  transform(value: unknown[], key: string, ascending = true): unknown[] {
    if (!Array.isArray(value) || !key) {
      return value;
    }

    return value.sort((a, b) => {
      if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
        return 0;
      }
      
      const aValue = (a as any)[key];
      const bValue = (b as any)[key];

      if (aValue < bValue) {
        return ascending ? -1 : 1;
      }
      if (aValue > bValue) {
        return ascending ? 1 : -1;
      }
      return 0;
    });
  }
}