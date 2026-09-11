import type { Request, Response, NextFunction } from 'express'
import * as service from '../services/customerService.js'
import type { CreateCustomerDto } from '../dto/customer/createCustomerDto.js'
import type { UpdateCustomerDto } from '../dto/customer/updateCustomerDto.js'
import { AppError } from '../errors/AppError.js'

type CustomerIdParams = { id: string }
type CreateCustomerRequest = Request<
  Record<string, never>,
  unknown,
  CreateCustomerDto
>
type UpdateCustomerRequest = Request<
  CustomerIdParams,
  unknown,
  UpdateCustomerDto
>

function parseId(value: string): number {
  const id = Number(value)
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(id) ||
    id < 1 ||
    id > 2147483647
  ) {
    throw new AppError('ID deve ser um inteiro positivo válido.', 400)
  }
  return id
}

export async function retrieveAll(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json(await service.findAll())
  } catch (error) {
    next(error)
  }
}

export async function retrieveOne(
  req: Request<CustomerIdParams>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json(await service.findById(parseId(req.params.id)))
  } catch (error) {
    next(error)
  }
}

export async function create(
  req: CreateCustomerRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const customer = await service.create(req.body)
    res.status(201).json(customer)
  } catch (error) {
    next(error)
  }
}

export async function update(
  req: UpdateCustomerRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json(await service.update(parseId(req.params.id), req.body))
  } catch (error) {
    next(error)
  }
}

export async function remove(
  req: Request<CustomerIdParams>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await service.remove(parseId(req.params.id))
    res.status(204).end()
  } catch (error) {
    next(error)
  }
}
