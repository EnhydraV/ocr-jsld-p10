// Validation des entrees par schema : toute donnee venue du client passe par un schema zod
// avant d'atteindre la couche metier.
import { BadRequestException, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.issues.map((i) => `${i.path.join('.')} : ${i.message}`));
    }
    return result.data;
  }
}
