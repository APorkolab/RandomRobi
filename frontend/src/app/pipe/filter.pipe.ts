import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filter',
    pure: true,
    standalone: true
})
export class FilterPipe implements PipeTransform {
  transform(value: unknown[], searchTerm: string, key?: string): unknown[] {
    if (!Array.isArray(value) || !searchTerm) {
      return value;
    }

    return value.filter(item => {
      if (key && item && typeof item === 'object') {
        const itemValue = (item as Record<string, unknown>)[key]?.toString().toLowerCase();
        return itemValue?.includes(searchTerm.toLowerCase());
      } else if (item && typeof item === 'object') {
        return Object.values(item).some(val =>
          val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return false;
    });
  }
}