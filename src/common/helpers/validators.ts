import { ValidationOptions, ValidationTypes, ValidationArguments, registerDecorator, isUUID } from 'class-validator';

export function AllowEmpty(validationOptions?: ValidationOptions) {
  return function(object: any, propertyName: string) {
    registerDecorator({
      name: ValidationTypes.CONDITIONAL_VALIDATION,
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: { validate() { return true; } },
      constraints: [
        (object: any) => {
          return object[propertyName] !== "";
        },
      ],
    });
  }
}

export function IsUUIDOrEmpty(validationOptions?: ValidationOptions) {
  return function(object: any, propertyName: string) {
    registerDecorator({
      name: 'isUUIDOrEmptyOrNull',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          // Allow empty string, null, or the literal string "null"
          if (value === '' || value === null || value === undefined || value === "null") {
            return true;
          }
          // Otherwise, validate as UUID
          return isUUID(value);
        },
        defaultMessage() {
          return 'Value must be a valid UUID, empty, or null';
        }
      }
    });
  }
}
