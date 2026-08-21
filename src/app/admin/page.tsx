'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify')
        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          router.push('/admin/login')
        }
      } catch {
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Carregando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">Painel Administrativo</h1>
          <p className="text-gray-400">Gerencie o conteúdo da Copa Ace</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="brand-card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Notícias</h3>
            <p className="text-gray-400 mb-4">Publique, edite e remova notícias e anúncios</p>
            <Link href="/admin/noticias" className="brand-button-primary">
              Gerenciar Notícias
            </Link>
          </div>

          <div className="brand-card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Inscrições Copa Ace 10</h3>
            <p className="text-gray-400 mb-4">Consulte equipes, contatos e comprovantes recebidos</p>
            <Link
              href="/admin/inscricoes"
              className="brand-button-primary"
            >
              Ver inscrições
            </Link>
          </div>

          <div className="brand-card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Campeonatos FACEIT</h3>
            <p className="text-gray-400 mb-4">Vincule cada edição e sincronize times, partidas, horários e chaveamento</p>
            <Link href="/admin/faceit" className="brand-button-primary">
              Gerenciar FACEIT
            </Link>
          </div>

          <div className="brand-card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Transmissão ao vivo</h3>
            <p className="text-gray-400 mb-4">Informe a live do YouTube e controle sua exibição na Home</p>
            <Link href="/admin/live" className="brand-button-primary">
              Gerenciar transmissão
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={async () => {
              await fetch('/api/admin/logout', { method: 'POST' })
              router.push('/admin/login')
            }}
            className="bg-clutch-pink px-4 py-2 font-semibold text-white transition hover:brightness-110"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  )
}
