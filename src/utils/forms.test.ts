import { describe, expect, it } from 'vitest'
import { parseSubjects } from './forms'

describe('parseSubjects', () => {
    it('passes an array through untouched', () => {
        expect(parseSubjects(['Maths', 'Physics'])).toEqual(['Maths', 'Physics'])
    })

    it('splits the comma-joined string an autofill can produce', () => {
        expect(parseSubjects('Maths,Physics')).toEqual(['Maths', 'Physics'])
    })
})
