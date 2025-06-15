// pages/index.js
import { Metadata } from 'next'
import ResourceList from '@/components/ResourceList'
import ArticleList from '@/components/ArticleList'
import { getSortedPostsData } from '@/lib/posts'

export const metadata: Metadata = {
  title: 'Core App Dashboard - Home',
  description: 'Welcome to Core App Dashboard, a powerful solution for managing your applications.Core App Dashboard is a centralized visual interface that provides an overview of an application\'s key features, data & functionalities.',
  keywords: 'dashboard,Core App Dashboard , application management, Core App, App Dashboard ',
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

async function getResources() {
  const resources = [
    {
      isImageCard: true,
      image: '/coreappdashboard.png',
      name: 'Core App Dashboard',
    }
  ]
  return resources
}

export default async function Home() {
  const resources = await getResources()
  const allPostsData = await getSortedPostsData()
  const recentPosts = allPostsData.slice(0, 6)

  return (
    <div className="container mx-auto py-12 space-y-16">
      <div className="w-full bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 py-10 mb-8 shadow-lg">
        <div className="container mx-auto flex flex-col items-center">
          <img src="/coreappdashboard.png" alt="Core App Dashboard" className="w-40 h-40 object-contain mb-4 rounded-2xl shadow-md" />
          <div className="text-3xl font-extrabold text-white drop-shadow">Core App Dashboard</div>
        </div>
      </div>
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-800 text-transparent bg-clip-text drop-shadow-lg">
          Core App Dashboard
        </h1>
        <h2 className="text-2xl tracking-tighter sm:text-3xl md:text-3xl lg:text-3xl">A Powerful Dashboard Solution</h2>
        <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
          Core App Dashboard is a modern, feature-rich dashboard solution for managing your applications. It is a centralized visual interface that provides an overview of an application.
        </p>
      </section>

      <ResourceList resources={resources} />
      <ArticleList articles={recentPosts} />
    </div>
  )
}
