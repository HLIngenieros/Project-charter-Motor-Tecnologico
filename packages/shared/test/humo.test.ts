import { describe, expect, it } from 'vitest'
import { VERSION } from '../src/index'

describe('shared', () => {
  it('expone la versión', () => {
    expect(VERSION).toBe('0.1.0')
  })
})
