import { useParams } from 'react-router-dom'

export default function Profile() {
  const { username } = useParams()

  return (
    <section className="flex-1 max-w-[650px] border-r border-outline-variant/30 min-h-screen">
      <div className="flex items-center justify-center h-full">
        <p className="text-on-surface-variant">Profile page for @{username}</p>
      </div>
    </section>
  )
}
