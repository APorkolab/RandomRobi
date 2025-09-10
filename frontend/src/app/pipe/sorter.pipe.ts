import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'sorter',
    pure: true,
    standalone: false
})
export class SorterPipe implements PipeTransform {
  transform(value: unknown[], key: string, ascending = true): unknown[] {
    if (!Array.isArray(value) || !key) {
      return value;
    }

    return value.sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

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