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
        validate(value: any, args: ValidationArguments) {
          console.log(`Validating ${propertyName}:`, value, 
                     `Type: ${typeof value}`, 
                     `isNull: ${value === null}`, 
                     `isEmpty: ${value === ''}`);
                     
          return value === null || value === '' || value === undefined || isUUID(value);
        },
        defaultMessage(args: ValidationArguments) {
          const value = args.value;
          return `${propertyName} must be a UUID or empty (received: ${value}, type: ${typeof value})`;
        },
      },
    });
  };
}
