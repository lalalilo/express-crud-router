import { Request } from "express"

type RaRecord = {id: string | number}

export const populateReference = <R extends RaRecord, T extends RaRecord>({fetchAll,source, target = 'id'}: {
  fetchAll: (rows: R[]) => Promise<T[]>,
  source: keyof R
  target?: keyof T
  }) => {
    const cache = new Cache()

    return async (record: R, {rows, req}: {rows: R[], req: Request}) => {
      let referencesByTarget = cache.get(req)

      if (!referencesByTarget) {
        const references = await fetchAll(rows)

        referencesByTarget = references.reduce((referencesByTarget, reference) => {
          referencesByTarget[reference[target ?? 'id'] as unknown as string] = reference
          return referencesByTarget
        }, {} as Record<string, T>)

        cache.set(req, referencesByTarget)
      }

      return referencesByTarget[record[source] as unknown as string]
  }
}

export const populateReferenceMany = <R extends RaRecord, T extends RaRecord>({fetchAll,source= 'id', target }: {
  fetchAll: (rows: R[], req: Request) => Promise<T[]>,
  source?: keyof R
  target: keyof T
  }) => {
    const cache = new Cache()

    return async (record: R, {rows, req}: {rows: R[], req: Request}) => {
      let referencesByTarget = cache.get(req)

      if (!referencesByTarget) {
        const references = await fetchAll(rows, req)

        referencesByTarget = references.reduce((referencesByTarget, reference) => {
          if (!referencesByTarget[reference[target] as unknown as string]) {
            referencesByTarget[reference[target] as unknown as string] = []
          }
          referencesByTarget[reference[target] as unknown as string].push(reference)
          return referencesByTarget
        }, {} as Record<string, T[]>)

        cache.set(req, referencesByTarget)
      }
      return referencesByTarget[record[source ?? 'id'] as unknown as string] ?? []
  }
}


export const populateReferenceManyCount = <R extends RaRecord, T extends RaRecord>({fetchAll,source= 'id', target }: {
  fetchAll: (rows: R[], req: Request) => Promise<T[]>,
  source?: keyof R
  target: keyof T
  }) => {
    const cache = new Cache()

    return async (record: R, {rows, req}: {rows: R[], req: Request}) => {
      let referencesByTarget = cache.get(req)

      if (!referencesByTarget) {
        const references = await fetchAll(rows, req)

        referencesByTarget = references.reduce((referencesByTarget, reference) => {
          if (!referencesByTarget[reference[target] as unknown as string]) {
            referencesByTarget[reference[target] as unknown as string] = []
          }
          referencesByTarget[reference[target] as unknown as string].push(reference)
          return referencesByTarget
        }, {} as Record<string, T[]>)

        cache.set(req, referencesByTarget)
      }

      return referencesByTarget[record[source ?? 'id'] as unknown as string]?.length ?? 0
  }
}

export const populateReferenceOne = <R extends RaRecord, T extends RaRecord>({fetchAll,source= 'id', target }: {
  fetchAll: (rows: R[], req: Request) => Promise<T[]>,
  source?: keyof R
  target: keyof T,
  }) => {
    const getAllReferences = populateReferenceMany({fetchAll,source, target})

    return async (record: R, {rows, req}: {rows: R[], req: Request}) => {
      const references = await getAllReferences(record, {rows,req})
      return references[0]
  }
}

let id = 1

class Cache {
  private id: number

  constructor() {
    this.id = id
    id += 1
  }

  get = (req: any) =>{
    if (!req.locals?.expressCrudRouter){
      return undefined
    }

    return req.locals.expressCrudRouter[this.id]
  }

  set = (req: any, value: any) => {
    req = req

    if (!req.locals) {
      req.locals = {}
    }
    if (!req.locals.expressCrudRouter) {
      req.locals.expressCrudRouter = {}
    }

    req.locals.expressCrudRouter[this.id] = value
  }
}
