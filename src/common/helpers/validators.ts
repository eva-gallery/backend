import { ValidationOptions, ValidationTypes, registerDecorator, isUUID } from 'class-validator';

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
      name: 'isUuidOrEmpty',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          return value === null || value === '' || isUUID(value);
        },
        defaultMessage() {
          return `${propertyName} must be a UUID or empty`;
        },
      },
    });
  };
}
