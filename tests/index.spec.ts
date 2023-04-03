import { crud } from '../src'
import { setupApp } from './app'
import { User } from './User'

describe('crud', () => {
  const ctx = {
    server: null,
  }

  beforeEach(async () => {
    jest.resetAllMocks()
  })

  afterEach(() => {
    ctx.server.close()
  })

  const expectReqRes = expect.objectContaining({
    req: expect.any(Object),
    res: expect.any(Object),
  })

  describe('actions', () => {
    describe('GET_LIST', () => {
      it('calls getList with expected params', async () => {
        const getList = jest.fn()

        const dataProvider = await setupApp(
          crud('/users', {
            getList,
          }),
          ctx
        )

        const rows = new Array(5).fill(1)
        const totalCount = 300

        getList.mockResolvedValue({
          count: totalCount,
          rows: rows as User[],
        })

        const response = await dataProvider.getList('users', {
          pagination: { page: 3, perPage: 5 },
          sort: { field: 'name', order: 'DESC' },
          filter: {},
        })

        expect(response.data).toEqual(rows)
        expect(response.total).toEqual(totalCount)
        expect(getList).toHaveBeenCalledWith({
          offset: 10,
          limit: 5,
          filter: {},
          order: [['name', 'DESC']],
        }, expectReqRes)
      })

      it('parses filter rules', async () => {
        const getList = jest.fn()

        const dataProvider = await setupApp(
          crud('/users', {
            getList,
          }, {
            filters: {
              q: q => ({
                name: { $or: q.split(' ') }
              })
            }
          }),
          ctx
        )

        const rows = new Array(5).fill(1)
        const totalCount = 300

        getList.mockResolvedValue({
          count: totalCount,
          rows: rows as User[],
        })

        const response = await dataProvider.getList('users', {
          pagination: { page: 3, perPage: 5 },
          sort: { field: 'name', order: 'DESC' },
          filter: { q: 'some name' },
        })

        expect(response.data).toEqual(rows)
        expect(response.total).toEqual(totalCount)
        expect(getList).toHaveBeenCalledWith({
          offset: 10,
          limit: 5,
          filter: { name: { $or: ['some', 'name'] } },
          order: [['name', 'DESC']],
        }, expectReqRes)
      })
    })

    describe('DELETE', () => {
      it('calls destroy with expected params', async () => {
        const destroy = jest.fn()
        const dataProvider = await setupApp(
          crud('/users', {
            destroy,
          }),
          ctx
        )

        const response = await dataProvider.delete('users', {
          id: 1,
        })

        expect(response.data).toEqual({ id: '1' })
        expect(destroy).toHaveBeenCalledWith('1', expectReqRes)
      })
    })

    describe('UPDATE', () => {
      it('calls update with expected params', async () => {
        const getOne = jest.fn().mockResolvedValue({ id: 1, name: 'Éloi' })
        const update = jest.fn().mockResolvedValue({ id: 1, name: 'Éloi' })

        const dataProvider = await setupApp(
          crud('/users', {
            getOne,
            update,
          }),
          ctx
        )

        const response = await dataProvider.update('users', {
          id: 1,
          data: {
            name: 'Éloi',
          },
        })

        expect(response.data).toEqual({ id: 1, name: 'Éloi' })
        expect(update).toHaveBeenCalledWith('1', { name: 'Éloi' }, expectReqRes)
      })

      it('throws if getOne is not defined', async () => {
        expect.assertions(1)

        const update = jest.fn().mockResolvedValue(null)

        try {
          await setupApp(
            crud('/users', {
              update,
            }),
            ctx
          )
        } catch (error) {
          expect(error).toBeDefined()
        }
      })

      it('throws a 404 if record is not found', async () => {
        expect.assertions(1)

        const update = jest.fn()
        const getOne = jest.fn().mockResolvedValue(null)

        const dataProvider = await setupApp(
          crud('/users', {
            getOne,
            update,
          }),
          ctx
        )

        try {
          await dataProvider.update('users', {
            id: 1,
            data: {
              name: 'Éloi',
            },
          })
        } catch (error) {
          expect(error.status).toEqual(404)
        }
      })
    })

    describe('CREATE', () => {
      it('calls create with expected params', async () => {
        const create = jest.fn().mockResolvedValue({ id: 1, name: 'Éloi' })
        const dataProvider = await setupApp(
          crud('/users', {
            create,
          }),
          ctx
        )

        const response = await dataProvider.create('users', {
          data: {
            name: 'Éloi',
          },
        })

        expect(response.data).toEqual({ id: 1, name: 'Éloi' })
        expect(create).toHaveBeenCalledWith({ name: 'Éloi' }, expectReqRes)
      })
    })

    describe('GET_ONE', () => {
      it('calls getOne with expected params', async () => {
        const getOne = jest.fn().mockResolvedValue({ id: 1, name: 'Éloi' })
        const dataProvider = await setupApp(
          crud('/users', {
            getOne,
          }),
          ctx
        )

        const response = await dataProvider.getOne('users', {
          id: 1,
        })

        expect(response.data).toEqual({ id: 1, name: 'Éloi' })
        expect(getOne).toHaveBeenCalledWith('1', expectReqRes)
      })

      it('throws a 404 when record is not found', async () => {
        expect.assertions(1)

        const getOne = jest.fn().mockResolvedValue(null)
        const dataProvider = await setupApp(
          crud('/users', {
            getOne,
          }),
          ctx
        )

        try {
          await dataProvider.getOne('users', {
            id: 1,
          })
        } catch (error) {
          expect(error.status).toEqual(404)
        }
      })
    })
  })
})
