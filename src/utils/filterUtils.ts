import { ObjectId } from "mongodb";
import { FindOptionsWhere } from "typeorm";

export class FilterUtils {
  static parseFilters(query: Record<string, any>): any {
    const filters: any = {};

    if (query.filters) {
      const filterGroups = query.filters;

      // If $and operator exists in the filters, handle that case
      if (filterGroups['$and']) {
        const andConditions = filterGroups['$and'].map((filterGroup: any) => {
          return this.buildFilterGroup(filterGroup);
        });
        filters['$and'] = andConditions;
      } else {
        // Flat filter format (no $and)
        Object.entries(filterGroups).forEach(([key, condition]) => {
          filters[key] = this.buildFilterGroup(condition);
        });
      }
    }
    console.log('Filters:', filters)

    return filters;
  }

  static buildFilterGroup(condition: any): any {
    // Handle single condition in the format { $eq: value, $gte: value, etc. }
    const operator = Object.keys(condition)[0];
    let value = condition[operator];

    if(value && Array.isArray(value) ){
      value = value.map(val=>this.isObjectId(val) ? new ObjectId(val) : val )
    }else if(value && this.isObjectId(value) ){
      value = new ObjectId(value)
    }

    // Handle the common operators: $eq, $ne, $in, $gte, $lte, etc.
    switch (operator) {
      case '$eq':
        return { $eq: value };
      case '$ne':
        return { $ne: value };
      case '$in':
        return { $in: Array.isArray(value) ? value : [value] };
      case '$gte':
        return { $gte: new Date(value) }; 
      case '$lte':
        return { $lte: new Date(value) }; 
      case '$gt':
        return { $gt: value };
      case '$lt':
        return { $lt: value };
      case '$regex':
        return { $regex: value, $options: 'i' }; 
      default:
        return value; 
    }
  }

  static isObjectId(value: string): boolean {
    // Check if the value is a valid ObjectId string
    return /^[a-fA-F0-9]{24}$/.test(value);
  }

  static buildMongoFilters<T>(
    query: Record<string, any>,
    allowedFields: (keyof T)[] = []
  ): FindOptionsWhere<T> {
    const filters: FindOptionsWhere<T> = {};
    const parsedFilters = this.parseFilters(query);
    // Validate allowed fields and apply the filters
    for (const [key, value] of Object.entries(parsedFilters)) {
      if (allowedFields.includes(key as keyof T) && value !== undefined) {
        filters[key as keyof T] = value as any;  // Cast value to `any` to match `FindOptionsWhere<T>`
      }
    }

    return filters;
  }
}
