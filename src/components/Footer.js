// components/Footer.js
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <div>
              <div className="flex flex-row items-center gap-4 mb-2">
                <h3 className="text-sm font-semibold text-blue-700 tracking-wider uppercase">About</h3>
                <div className="flex flex-col items-center">
                  <img src="/coreappdashboard.png" alt="Core App Dashboard3" className="w-10 h-10 object-contain rounded-2xl shadow-md" />
                  <div className="text-xs font-bold text-blue-700 drop-shadow">Core App Dashboard</div>
                </div>
              </div>
              <p className="mt-2 text-base text-gray-500">
                Core App Dashboard is a modern, feature-rich dashboard solution built with Next.js, providing powerful tools for managing your applications.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Quick Links</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link href="/" className="text-base text-gray-500 hover:text-gray-900">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-base text-gray-500 hover:text-gray-900">
                  Resources
                </Link>
              </li>
              <li>
                <Link href="/posts" className="text-base text-gray-500 hover:text-gray-900">
                  Articles
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">Connect</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a href="https://coreappdashboard.net/" target="_blank" className="text-base text-gray-500 hover:text-gray-900">
                  Core App Dashboard
                </a>
              </li>
              <li>
                <a href="https://github.com/businesszh/coreappdashboard" target="_blank" className="text-base text-gray-500 hover:text-gray-900">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://twitter.com/coreappdashboard" target="_blank" className="text-base text-gray-500 hover:text-gray-900">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 text-center">
            &copy; {new Date().getFullYear()} Core App Dashboard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
