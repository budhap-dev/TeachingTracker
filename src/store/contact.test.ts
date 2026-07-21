import { describe, expect, it } from 'vitest'
import { call, put } from 'redux-saga/effects'
import type { Contact } from '../data/contact'
import { fetchContact, updateContact } from '../api/contact'
import { loadContactSaga, updateContactSaga } from './sagas'
import {
    fetchContactFailed,
    fetchContactRequested,
    fetchContactSucceeded,
    studentReducer,
    updateContactFailed,
    updateContactRequested,
    updateContactSucceeded,
} from './store'

const base = () => studentReducer(undefined, { type: '@@init' })

const contact: Contact = { email: 'hello@example.com', phone: '+44 7700 900000' }

describe('contact reducers', () => {
    it('marks the details loading, then stores them', () => {
        const loading = studentReducer(base(), fetchContactRequested())
        expect(loading.contactLoading).toBe(true)

        const loaded = studentReducer(loading, fetchContactSucceeded(contact))
        expect(loaded.contact).toEqual(contact)
        expect(loaded.contactLoading).toBe(false)
    })

    it('surfaces a load failure', () => {
        const next = studentReducer(base(), fetchContactFailed('down'))
        expect(next.contactLoading).toBe(false)
        expect(next.error).toBe('down')
        expect(next.notice).toEqual({ kind: 'error', message: 'down' })
    })

    it('tracks an update and confirms it saved', () => {
        const requested = studentReducer(
            { ...base(), error: 'stale' },
            updateContactRequested({ email: 'new@example.com' })
        )
        expect(requested.savingContact).toBe(true)
        expect(requested.error).toBeNull()

        const saved: Contact = { email: 'new@example.com' }
        const done = studentReducer(requested, updateContactSucceeded(saved))
        expect(done.contact).toEqual(saved)
        expect(done.savingContact).toBe(false)
        expect(done.notice).toEqual({
            kind: 'success',
            message: 'Contact details updated.',
        })
    })

    it('surfaces an update failure', () => {
        const next = studentReducer(base(), updateContactFailed('bad'))
        expect(next.savingContact).toBe(false)
        expect(next.error).toBe('bad')
    })
})

describe('contact sagas', () => {
    it('loads the contact details', () => {
        const gen = loadContactSaga()
        expect(gen.next().value).toEqual(call(fetchContact))
        expect(gen.next(contact).value).toEqual(
            put(fetchContactSucceeded(contact))
        )
        expect(gen.next().done).toBe(true)
    })

    it('reports a load failure with the generic message', () => {
        const gen = loadContactSaga()
        gen.next()
        expect(gen.throw('boom').value).toEqual(
            put(fetchContactFailed('Failed to load data'))
        )
    })

    it('saves an update and stores the returned record', () => {
        const input = { email: 'new@example.com', phone: '' }
        const gen = updateContactSaga(updateContactRequested(input))
        expect(gen.next().value).toEqual(call(updateContact, input))
        const saved: Contact = { email: 'new@example.com' }
        expect(gen.next(saved).value).toEqual(put(updateContactSucceeded(saved)))
        expect(gen.next().done).toBe(true)
    })

    it('reports an update failure with the error message', () => {
        const gen = updateContactSaga(updateContactRequested({ email: 'x' }))
        gen.next()
        expect(gen.throw(new Error('503')).value).toEqual(
            put(updateContactFailed('Could not update contact details: 503'))
        )
    })

    it('falls back to a readable update message', () => {
        const gen = updateContactSaga(updateContactRequested({ email: 'x' }))
        gen.next()
        expect(gen.throw('kaboom').value).toEqual(
            put(updateContactFailed('Could not update contact details.'))
        )
    })
})
