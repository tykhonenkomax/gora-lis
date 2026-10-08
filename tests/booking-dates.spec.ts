import { test, expect } from '@playwright/test'
import { nightsBetween, overlaps, rangeError, validDay, dateKey, shiftMonth, parseDay } from '../src/data/bookingDates'

test('checkout is free; adjacent stays allowed; crossing stays blocked', () => {
  expect(nightsBetween('2028-02-28', '2028-03-02')).toEqual(['2028-02-28', '2028-02-29', '2028-03-01'])
  expect(overlaps('2028-03-02', '2028-03-05', '2028-02-28', '2028-03-02')).toBe(false)
  expect(overlaps('2028-03-01', '2028-03-05', '2028-02-28', '2028-03-02')).toBe(true)
  expect(overlaps('2028-02-27', '2028-03-05', '2028-02-28', '2028-03-02')).toBe(true)
})

test('invalid dates, past check-in and zero-night bookings rejected', () => {
  expect(validDay('2027-02-29')).toBe(false)
  expect(validDay('2028-02-29')).toBe(true)
  expect(validDay('2028-13-01')).toBe(false)
  expect(rangeError('', '', '2028-01-01')).not.toBe('')
  expect(rangeError('2027-12-31', '2028-01-02', '2028-01-01')).not.toBe('')
  expect(rangeError('2028-01-02', '2028-01-02', '2028-01-01')).not.toBe('')
  expect(rangeError('2028-01-03', '2028-01-02', '2028-01-01')).not.toBe('')
  expect(rangeError('2028-01-01', '2029-01-02', '2028-01-01')).not.toBe('')
  expect(rangeError('2028-01-01', '2029-01-01', '2028-01-01')).toBe('')
})

test('calendar crosses year and daylight-saving boundaries correctly', () => {
  expect(dateKey(shiftMonth(parseDay('2028-12-01'), 1))).toBe('2029-01-01')
  expect(nightsBetween('2026-10-24', '2026-10-27')).toEqual(['2026-10-24', '2026-10-25', '2026-10-26'])
})
