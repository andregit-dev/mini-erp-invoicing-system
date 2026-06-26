import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'futureDate', async: false })
export class IsFutureDate implements ValidatorConstraintInterface {
  validate(date: string, args: ValidationArguments) {
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(inputDate.getTime())) {
      return false;
    }

    inputDate.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setFullYear(maxDate.getFullYear() + 1);

    return inputDate >= today && inputDate <= maxDate;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Due date must be today or within 1 year from now';
  }
}
