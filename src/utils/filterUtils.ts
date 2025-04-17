import { FindOptionsWhere, ILike, In, MoreThan, MoreThanOrEqual, LessThan, LessThanOrEqual, Not } from 'typeorm';

export class FilterUtils {
  static parseFilters(query: Record<string, any>): any {
    const filters: any = {};

    if (query.filters) {
      const filterGroups = query.filters;

      if (filterGroups['$and']) {
        const andConditions = filterGroups['$and'].map((filterGroup: any) => {
          return this.buildFilterGroup(filterGroup);
        });
        filters['$and'] = andConditions;
      } else {
        Object.entries(filterGroups).forEach(([key, condition]) => {
          filters[key] = this.buildFilterGroup(condition);
        });
      }
    }
    console.log('Filters:', filters);

    return filters;
  }

  static buildFilterGroup(condition: any): any {
    const operator = Object.keys(condition)[0];
    let value = condition[operator];

    switch (operator) {
      case '$eq':
        return value;
      case '$ne':
        return Not(value);
      case '$in':
        return In(Array.isArray(value) ? value : [value]);
      case '$gte':
        return MoreThanOrEqual(value);
      case '$lte':
        return LessThanOrEqual(value);
      case '$gt':
        return MoreThan(value);
      case '$lt':
        return LessThan(value);
      case '$regex':
        return ILike(`%${value}%`);
      default:
        return value;
    }
  }

  static buildPostgresFilters<T>(
    query: Record<string, any>,
    allowedFields: (keyof T)[] = []
  ): FindOptionsWhere<T> {
    const filters: FindOptionsWhere<T> = {};
    const parsedFilters = this.parseFilters(query);

    for (const [key, value] of Object.entries(parsedFilters)) {
      if (allowedFields.includes(key as keyof T) && value !== undefined) {
        filters[key as keyof T] = value as any;
      }
    }

    return filters;
  }
}
