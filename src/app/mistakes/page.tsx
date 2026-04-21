import { NavBar } from '@/components/NavBar'
import { MistakeDiary } from '@/components/MistakeDiary'

export default function MistakesPage() {
  return (
    <div className="min-h-screen bg-navy">
      <NavBar />
      <MistakeDiary />
    </div>
  )
}
