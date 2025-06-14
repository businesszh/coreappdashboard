// pages/index.js
import fs from 'fs'
import path from 'path'
import { getSortedPostsData } from '@/lib/posts'
import ResourceList from '@/components/ResourceList'
import ArticleList from '@/components/ArticleList'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Core App Dashboard - Home',
  description: 'Welcome to Core App Dashboard, a powerful solution for managing your applications. Built with Next.js, Tailwind CSS, and Shadcn/UI.',
  keywords: 'dashboard, admin panel, application management, next.js, tailwind css',
  openGraph: {
    title: 'Core App Dashboard - Home',
    description: 'Welcome to Core App Dashboard, a powerful solution for managing your applications.',
    url: 'https://coreappdashboard.net',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Core App Dashboard - Home',
    description: 'Welcome to Core App Dashboard, a powerful solution for managing your applications.',
  },
}

export default function Home() {
  const resourcesPath = path.join(process.cwd(), 'data', 'json', 'resources.json')
  const resources = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'))
  const resourcesWithImage = [
    ...resources,
    {
      isImageCard: true,
      image: '/coreappdashboard.png',
      name: 'Core App Dashboard',
    },
  ]
  const allPostsData = getSortedPostsData().slice(0, 6)

  return (
    <div className="container mx-auto py-12 space-y-16">
      <div className="w-full bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 py-10 mb-8 shadow-lg">
        <div className="container mx-auto flex flex-col items-center">
          <img src="/coreappdashboard.png" alt="Core App Dashboard1" className="w-40 h-40 object-contain mb-4 rounded-2xl shadow-md" />
          <div className="text-3xl font-extrabold text-white drop-shadow">Core App Dashboard</div>
        </div>
      </div>
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-800 text-transparent bg-clip-text drop-shadow-lg">
          Core App Dashboard
        </h1>
        <h2 className="text-2xl tracking-tighter sm:text-3xl md:text-3xl lg:text-3xl">A Powerful Dashboard Solution</h2>
        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
          Core App Dashboard is a modern, feature-rich dashboard solution built with Next.js, Tailwind CSS, and Shadcn/UI, providing a seamless experience for managing your applications.
        </p>
      </section>

      <ResourceList resources={resourcesWithImage} />

      <ArticleList articles={allPostsData} />
    </div>
  )
}