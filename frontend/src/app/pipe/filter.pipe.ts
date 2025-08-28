import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filter',
    pure: true,
    standalone: false
})
export class FilterPipe implements PipeTransform {
  transform(value: any[], searchTerm: string, key?: string): any[] {
    if (!Array.isArray(value) || !searchTerm) {
      return value;
    }

    return value.filter(item => {
      if (key) {
        const itemValue = item[key]?.toString().toLowerCase();
        return itemValue?.includes(searchTerm.toLowerCase());
      } else {
        return Object.values(item).some(val =>
          val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    });
  }
}