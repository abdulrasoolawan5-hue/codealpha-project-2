import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <Compass size={48} className="mx-auto text-neutral-300 mb-4" />
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-neutral-500 mb-6">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn btn-primary">Back to shop</Link>
    </div>
  )
}
