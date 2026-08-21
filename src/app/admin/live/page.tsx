import Link from 'next/link'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ArrowLeft, Radio, Save } from 'lucide-react'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseYouTubeVideoId } from '@/lib/youtube'

const fieldClass = 'mt-2 w-full border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-copa-cyan'
const messages: Record<string, string> = {
  saved: 'Transmissão atualizada com sucesso.',
  title: 'O título deve ter entre 3 e 120 caracteres.',
  url: 'Informe um link válido de vídeo ou live do YouTube.',
}

async function requireAdmin() {
  const token = (await cookies()).get('admin-token')?.value
  if (!token || verifyToken(token)?.role !== 'ADMIN') redirect('/admin/login')
}

async function saveLiveStream(formData: FormData) {
  'use server'
  await requireAdmin()

  const title = String(formData.get('title') || '').trim()
  const youtubeVideoId = parseYouTubeVideoId(String(formData.get('youtubeUrl') || '').trim())
  const visibleOnHome = formData.get('visibleOnHome') === 'on'
  if (title.length < 3 || title.length > 120) redirect('/admin/live?erro=title')
  if (!youtubeVideoId) redirect('/admin/live?erro=url')

  await prisma.liveStream.upsert({
    where: { id: 'home' },
    create: { id: 'home', title, youtubeVideoId, visibleOnHome },
    update: { title, youtubeVideoId, visibleOnHome },
  })
  revalidatePath('/')
  redirect('/admin/live?ok=saved')
}

export default async function LiveAdminPage({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string }> }) {
  await requireAdmin()
  const [params, liveStream] = await Promise.all([
    searchParams,
    prisma.liveStream.findUnique({ where: { id: 'home' } }),
  ])

  return (
    <main className="min-h-screen bg-gray-900 px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-cyan-400">
          <ArrowLeft size={16} /> Painel administrativo
        </Link>

        <div className="mt-6">
          <p className="brand-kicker inline-flex items-center gap-2"><Radio size={14} /> YouTube</p>
          <h1 className="mt-2 text-3xl font-black uppercase">Transmissão ao vivo</h1>
          <p className="mt-2 text-sm text-slate-400">Cole o link da transmissão e escolha quando o player deve aparecer na Home.</p>
        </div>

        {params.erro && <div role="alert" className="mt-6 border border-clutch-pink/30 bg-clutch-pink/10 p-4 text-clutch-pink">{messages[params.erro] || 'Não foi possível salvar.'}</div>}
        {params.ok && <div role="status" className="mt-6 border border-copa-cyan/30 bg-copa-cyan/10 p-4 text-copa-cyan">{messages[params.ok]}</div>}

        <form action={saveLiveStream} className="brand-card mt-8 grid gap-5 p-5 sm:p-6">
          <label className="text-sm font-bold text-slate-300">Título da transmissão
            <input name="title" required minLength={3} maxLength={120} defaultValue={liveStream?.title || 'Copa ACE 10 ao vivo'} className={fieldClass} placeholder="Copa ACE 10 — Rodada 1" />
          </label>
          <label className="text-sm font-bold text-slate-300">Link da live no YouTube
            <input name="youtubeUrl" type="url" required maxLength={500} defaultValue={liveStream ? `https://www.youtube.com/watch?v=${liveStream.youtubeVideoId}` : ''} className={fieldClass} placeholder="https://www.youtube.com/watch?v=..." />
          </label>
          <label className="flex cursor-pointer items-center gap-3 border border-slate-700 bg-slate-950/40 p-4 text-sm font-bold text-white">
            <input name="visibleOnHome" type="checkbox" defaultChecked={liveStream?.visibleOnHome} className="h-5 w-5 accent-cyan-400" />
            Exibir esta transmissão na Home
          </label>
          <button type="submit" className="brand-button-primary w-fit"><Save size={17} /> Salvar transmissão</button>
        </form>
      </div>
    </main>
  )
}
