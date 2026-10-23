import { useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import '@/styles/status-studio.css'

type Category = 'sad' | 'love' | 'friend'

const data: Record<Category, Array<string>> = {
  sad: [
    'হাসি দিয়ে সব কষ্ট লুকানো যায়, কিন্তু মনকে বোঝানো যায় না। 🖤',
    'যাকে নিজের ভাবলাম, সে-ই একদিন পর করে দিল। 💔',
    'কিছু মানুষ স্মৃতি হয়ে থাকে, জীবনে আর ফিরে আসে না।',
    'অভিমান জমতে জমতে একদিন মানুষ চুপ হয়ে যায়।',
    'ভালো থাকার অভিনয়টা এখন অভ্যাস হয়ে গেছে। 🥀',
    'সব হারানোর পর বুঝেছি, নিজের পাশে নিজেকেই থাকতে হয়।',
  ],
  love: [
    'তোমার হাসিতেই আমার ছোট্ট পৃথিবীটা সুন্দর। ❤️',
    'ভালোবাসা মানে দূরে থেকেও কাউকে অনুভব করা।',
    'হাজার মানুষের ভিড়েও মন শুধু তোমাকেই খোঁজে।',
    'তোমার সঙ্গে কাটানো মুহূর্তগুলো আমার প্রিয় স্মৃতি।',
  ],
  friend: [
    'সত্যিকারের বন্ধু সময়ের সঙ্গে বদলায় না। 🤝',
    'বন্ধুত্ব মানে বিপদে পাশে থাকার আরেক নাম।',
    'দূরত্ব বাড়তে পারে, কিন্তু সত্যিকারের বন্ধুত্ব নয়।',
    'কিছু বন্ধু রক্তের সম্পর্ক না হয়েও পরিবারের মতো।',
  ],
}

const tabs: Array<{ key: Category; label: string }> = [
  { key: 'sad', label: '💔 কষ্টের' },
  { key: 'love', label: '❤️ ভালোবাসা' },
  { key: 'friend', label: '🤝 বন্ধুত্ব' },
]

const defaultText = 'কিছু কথা হৃদয়ে থেকে যায়,\nসব কথা বলা হয় না... 🖤'

function downloadCard(text: string, size: number, onDone: (m: string) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = 1080
  canvas.height = 1080
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    onDone('ছবি তৈরি করা যায়নি।')
    return
  }

  const bg = ctx.createLinearGradient(0, 0, 1080, 1080)
  bg.addColorStop(0, '#32121f')
  bg.addColorStop(0.55, '#100d10')
  bg.addColorStop(1, '#050505')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, 1080, 1080)

  ctx.strokeStyle = '#704050'
  ctx.lineWidth = 3
  ctx.strokeRect(35, 35, 1010, 1010)

  const fontSize = size * 2.1
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.font = `${fontSize}px "Noto Sans Bengali", sans-serif`

  // Wrap per character (keeping user line breaks) so Bengali text fits the card
  const lines: Array<string> = []
  const maxWidth = 900
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const ch of Array.from(paragraph)) {
      const test = line + ch
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line)
        line = ch
      } else {
        line = test
      }
    }
    lines.push(line)
  }

  const lineHeight = fontSize * 1.8
  const startY = (1080 - lines.length * lineHeight) / 2 + lineHeight / 2
  lines.forEach((l, i) => ctx.fillText(l, 540, startY + i * lineHeight))

  ctx.fillStyle = '#ff7290'
  ctx.font = '30px sans-serif'
  ctx.fillText('Siddiq Status Studio', 540, 990)

  canvas.toBlob((blob) => {
    if (!blob) {
      onDone('ছবি তৈরি করা যায়নি।')
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'siddiq-status.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
    onDone('ছবি ডাউনলোড শুরু হয়েছে!')
  }, 'image/png')
}

function StatusStudio() {
  const [category, setCategory] = useState<Category>('sad')
  const [custom, setCustom] = useState('')
  const [lastText, setLastText] = useState(defaultText)
  const [size, setSize] = useState('24')
  const [message, setMessage] = useState('')
  const customRef = useRef<HTMLTextAreaElement>(null)

  const preview = custom.trim() ? custom : lastText

  function choose(text: string) {
    setLastText(text)
    setCustom(text)
  }

  function randomStatus() {
    const arr = data[category]
    choose(arr[Math.floor(Math.random() * arr.length)])
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(preview)
      setMessage('স্ট্যাটাস কপি হয়েছে!')
    } catch {
      setCustom(preview)
      requestAnimationFrame(() => {
        customRef.current?.focus()
        customRef.current?.select()
      })
      setMessage('লেখাটি নির্বাচন করা হয়েছে। Copy চাপো।')
    }
  }

  return (
    <div className="studio" lang="bn">
      <header>
        <h1>🖤 Siddiq Status Studio</h1>
        <p>তোমার মনের কথা, তোমার নিজের স্টাইলে</p>
      </header>

      <main>
        <h2>✍️ স্ট্যাটাসের ক্যাটাগরি</h2>
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={category === tab.key ? 'active' : undefined}
              aria-pressed={category === tab.key}
              onClick={() => setCategory(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <h2>🌙 স্ট্যাটাস বেছে নাও</h2>
        <div className="status-list">
          {data[category].map((text) => (
            <div className="item" key={text}>
              <div>{text}</div>
              <button onClick={() => choose(text)}>এই স্ট্যাটাসটি বেছে নাও</button>
            </div>
          ))}
        </div>

        <h2>📝 নিজের স্ট্যাটাস লেখো</h2>
        <textarea
          ref={customRef}
          rows={4}
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value)
            if (e.target.value.trim()) setLastText(e.target.value)
          }}
          placeholder="এখানে তোমার মনের কথা লেখো..."
        />

        <label htmlFor="size">লেখার আকার</label>
        <select id="size" value={size} onChange={(e) => setSize(e.target.value)}>
          <option value="24">মাঝারি</option>
          <option value="30">বড়</option>
          <option value="20">ছোট</option>
        </select>

        <h2>🎨 তোমার স্ট্যাটাস কার্ড</h2>
        <div className="card">
          <div className="preview" style={{ fontSize: `${size}px` }}>
            {preview}
          </div>
          <div className="brand">Siddiq Status Studio</div>
        </div>

        <div className="actions">
          <button onClick={copyText}>📋 লেখা কপি</button>
          <button onClick={() => downloadCard(preview, Number(size), setMessage)}>
            ⬇️ ছবি ডাউনলোড
          </button>
        </div>
        <button
          className="secondary"
          style={{ width: '100%', marginTop: 9 }}
          onClick={randomStatus}
        >
          🔄 নতুন স্ট্যাটাস দেখো
        </button>
        <p className="message" role="status" aria-live="polite">
          {message}
        </p>
      </main>

      <footer>Made with ❤️ | Siddiq Status Studio</footer>
    </div>
  )
}

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Siddiq Status Studio' },
      { name: 'theme-color', content: '#080808' },
    ],
  }),
  component: StatusStudio,
})
