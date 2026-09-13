import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: '✨ Nova AI Voice Assistant | নোভা এআই ভয়েস অ্যাসিস্ট্যান্ট',
      },
      {
        name: 'description',
        content:
          'Nova AI Voice Assistant - কথা বলুন ও শুনুন বাংলায় এবং ইংরেজিতে বুদ্ধিমত্তাসম্পন্ন কৃত্রিম সহকারী।',
      },
      {
        name: 'theme-color',
        content: '#0f172a',
      },
    ],
    links: [
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Hind+Siliguri:wght@400;500;600;700&display=swap',
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-[#0b0f19] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
