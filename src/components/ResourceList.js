// components/ResourceList.js
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

export default function ResourceList({ resources, showMoreLink = true }) {
  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tighter">Resources</h2>
        {showMoreLink && (
          <Link href="/resources" className="text-blue-600 hover:text-blue-800 transition-colors">
            More resources →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {resources.map((resource, index) => (
          resource.isImageCard ? (
            <Card key={index} className="flex flex-col items-center justify-center p-6">
              <img src={resource.image} alt={resource.name} className="w-32 h-32 object-contain mb-2 rounded-xl shadow-md" />
              <div className="text-xl font-bold text-blue-700 drop-shadow text-center">{resource.name}</div>
            </Card>
          ) : (
            <Card key={index}>
              <CardHeader>
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
                >
                  <CardTitle>{resource.name}</CardTitle>
                  <ExternalLink size={16} />
                </a>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
            </Card>
          )
        ))}
      </div>
    </section>
  )
}