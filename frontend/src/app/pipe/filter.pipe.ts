import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  pure: true
})
export class FilterPipe implements PipeTransform {
  transform(value: any[], searchTerm: string, key: string): any[] {
    if (!Array.isArray(value) || !searchTerm || !key) {
      return value;
    }

    return value.filter(item => {
      const itemValue = item[key]?.toString().toLowerCase();
      return itemValue.includes(searchTerm.toLowerCase());
    });
  }
}