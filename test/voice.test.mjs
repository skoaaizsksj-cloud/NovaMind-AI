import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { cleanTextForSpeech, detectLanguage } from '../src/lib/voice.ts'

describe('Voice Utilities', () => {
  describe('detectLanguage', () => {
    test('detects Bengali text with unicode characters', () => {
      const text = 'হ্যালো! আমি নোভা। আপনি মুখে কথা বলুন, আমি শুনে উত্তর দেব।'
      assert.equal(detectLanguage(text), 'bn-BD')
    })

    test('detects English text', () => {
      const text = 'Hello Nova, what is the weather like today?'
      assert.equal(detectLanguage(text), 'en-US')
    })

    test('detects short Bengali greeting', () => {
      const text = 'কেমন আছেন?'
      assert.equal(detectLanguage(text), 'bn-BD')
    })
  })

  describe('cleanTextForSpeech', () => {
    test('removes markdown formatting and preserves natural spoken words', () => {
      const raw = '### স্বাগতম!\nএটি একটি **গুরুত্বপূর্ণ** বিষয় এবং *বিশেষ* দ্রষ্টব্য।'
      const cleaned = cleanTextForSpeech(raw)
      assert.ok(!cleaned.includes('###'))
      assert.ok(!cleaned.includes('**'))
      assert.ok(!cleaned.includes('*'))
      assert.ok(cleaned.includes('স্বাগতম!'))
      assert.ok(cleaned.includes('গুরুত্বপূর্ণ'))
    })

    test('replaces code blocks with friendly spoken indicator', () => {
      const raw = 'কোড নিচে দেওয়া হলো:\n```js\nconsole.log("hello");\n```\nধন্যবাদ।'
      const cleaned = cleanTextForSpeech(raw)
      assert.ok(!cleaned.includes('```'))
      assert.ok(!cleaned.includes('console.log'))
      assert.ok(cleaned.includes('কোড ব্লক'))
    })

    test('handles empty and null inputs safely', () => {
      assert.equal(cleanTextForSpeech(''), '')
      assert.equal(cleanTextForSpeech(null), '')
      assert.equal(cleanTextForSpeech(undefined), '')
    })

    test('cleans links and list bullets', () => {
      const raw = '- [গুগল](https://google.com)\n- [ইউটিউব](https://youtube.com)'
      const cleaned = cleanTextForSpeech(raw)
      assert.ok(!cleaned.includes('https://'))
      assert.ok(cleaned.includes('গুগল'))
      assert.ok(cleaned.includes('ইউটিউব'))
    })
  })
})
