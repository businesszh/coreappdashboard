'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";

export default function ArticleEditor() {
  const [article, setArticle] = useState({ title: '', description: '', content: '', path: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const searchParams = useSearchParams();
  const path = searchParams.get('path');

  useEffect(() => {
    if (path) {
      fetchArticle(decodeURIComponent(path));
    } else {
      setError('No article path provided');
      setIsLoading(false);
    }
  }, [path]);

  const fetchArticle = async (articlePath) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/articles?path=${encodeURIComponent(articlePath)}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch article');
      }
      const data = await response.json();
      setArticle(data);
    } catch (error) {
      console.error('Error fetching article:', error);
      setError(error.message || 'Failed to fetch article. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setArticle({ ...article, [name]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save article');
      }
      
      setSuccess('Article saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error saving article:', error);
      setError(error.message || 'Failed to save article. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div>Loading article...</div>;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          {error}
        </Alert>
      )}
      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          {success}
        </Alert>
      )}
      <Input
        name="title"
        value={article.title}
        onChange={handleInputChange}
        placeholder="Article Title"
        disabled={isSaving}
      />
      <Input
        name="description"
        value={article.description}
        onChange={handleInputChange}
        placeholder="Article Description"
        disabled={isSaving}
      />
      <Textarea
        name="content"
        value={article.content}
        onChange={handleInputChange}
        placeholder="Article Content"
        rows={20}
        disabled={isSaving}
      />
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Article'}
      </Button>
    </div>
  );
}