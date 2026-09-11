import type { CreateCustomerDto } from './createCustomerDto.js'

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {}
