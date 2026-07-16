import Link from 'next/link'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ArrowLeft, Newspaper, Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmSubmit } from '@/components/ConfirmSubmit'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const fieldClass = 'mt-2 w-full border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-copa-cyan'
const messages: Record<string, string> = {
  created: 'Notícia publicada com sucesso.',
  updated: 'Notícia atualizada com sucesso.',
  deleted: 'Notícia removida.',
  title: 'O título deve ter entre 3 e 160 caracteres.',
  author: 'O autor deve ter entre 2 e 80 caracteres.',
  content: 'O conteúdo deve ter entre 10 e 10.000 caracteres.',
  missing: 'Notícia não encontrada.',
}

async function requireAdmin() {
  const token = (await cookies()).get('admin-token')?.value
  if (!token || verifyToken(token)?.role !== 'ADMIN') redirect('/admin/login')
}

function readNews(formData: FormData) {
  const title = String(formData.get('title') || '').trim()
  const author = String(formData.get('author') || '').trim()
  const content = String(formData.get('content') || '').trim()

  if (title.length < 3 || title.length > 160) return { error: 'title' }
  if (author.length < 2 || author.length > 80) return { error: 'author' }
  if (content.length < 10 || content.length > 10000) return { error: 'content' }
  return { data: { title, author, content } }
}

async function createNews(formData: FormData) {
  'use server'
  await requireAdmin()
  const input = readNews(formData)
  if (!input.data) redirect(`/admin/noticias?erro=${input.error}`)
  await prisma.news.create({ data: input.data })
  revalidatePath('/news')
  redirect('/admin/noticias?ok=created')
}

async function updateNews(id: string, formData: FormData) {
  'use server'
  await requireAdmin()
  const input = readNews(formData)
  if (!input.data) redirect(`/admin/noticias?erro=${input.error}`)
  const result = await prisma.news.updateMany({ where: { id }, data: input.data })
  if (!result.count) redirect('/admin/noticias?erro=missing')
  revalidatePath('/news')
  redirect('/admin/noticias?ok=updated')
}

async function deleteNews(id: string) {
  'use server'
  await requireAdmin()
  await prisma.news.deleteMany({ where: { id } })
  revalidatePath('/news')
  redirect('/admin/noticias?ok=deleted')
}

export default async function NewsAdminPage({ searchParams }: { searchParams: Promise<{ erro?: string; ok?: string }> }) {
  await requireAdmin()
  const [params, news] = await Promise.all([
    searchParams,
    prisma.news.findMany({ orderBy: { createdAt: 'desc' } }),
  ])

  return (
    <main className="min-h-screen bg-gray-900 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-cyan-400">
          <ArrowLeft size={16} /> Painel administrativo
        </Link>

        <div className="mt-6">
          <p className="brand-kicker">Conteúdo</p>
          <h1 className="mt-2 text-3xl font-black uppercase">Gerenciar notícias</h1>
          <p className="mt-2 text-sm text-slate-400">As publicações aparecem automaticamente na página de notícias.</p>
        </div>

        {params.erro && <div role="alert" className="mt-6 border border-clutch-pink/30 bg-clutch-pink/10 p-4 text-clutch-pink">{messages[params.erro] || 'Não foi possível concluir a operação.'}</div>}
        {params.ok && <div role="status" className="mt-6 border border-copa-cyan/30 bg-copa-cyan/10 p-4 text-copa-cyan">{messages[params.ok] || 'Operação concluída.'}</div>}

        <section className="brand-card mt-8 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Plus className="text-copa-cyan" size={22} />
            <h2 className="text-xl font-black uppercase">Nova notícia</h2>
          </div>
          <form action={createNews} className="mt-5 grid gap-4">
            <label className="text-sm font-bold text-slate-300">Título
              <input name="title" required minLength={3} maxLength={160} className={fieldClass} placeholder="Título da publicação" />
            </label>
            <label className="text-sm font-bold text-slate-300">Autor
              <input name="author" required minLength={2} maxLength={80} className={fieldClass} placeholder="Ace Produtora" />
            </label>
            <label className="text-sm font-bold text-slate-300">Conteúdo
              <textarea name="content" required minLength={10} maxLength={10000} rows={7} className={fieldClass} placeholder="Escreva a notícia completa" />
            </label>
            <button type="submit" className="brand-button-primary w-fit"><Newspaper size={17} /> Publicar notícia</button>
          </form>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-black uppercase">Publicadas ({news.length})</h2>
          <div className="mt-4 space-y-4">
            {news.length === 0 && <div className="brand-card p-8 text-center text-slate-400">Nenhuma notícia publicada.</div>}
            {news.map((article) => (
              <details key={article.id} className="brand-card group overflow-hidden">
                <summary className="cursor-pointer list-none p-5 hover:bg-copa-cyan/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-black text-white">{article.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{article.author} · {article.createdAt.toLocaleString('pt-BR')}</p>
                    </div>
                    <Pencil className="shrink-0 text-copa-cyan" size={18} />
                  </div>
                </summary>
                <div className="border-t border-slate-700 p-5">
                  <form action={updateNews.bind(null, article.id)} className="grid gap-4">
                    <label className="text-sm font-bold text-slate-300">Título
                      <input name="title" defaultValue={article.title} required minLength={3} maxLength={160} className={fieldClass} />
                    </label>
                    <label className="text-sm font-bold text-slate-300">Autor
                      <input name="author" defaultValue={article.author} required minLength={2} maxLength={80} className={fieldClass} />
                    </label>
                    <label className="text-sm font-bold text-slate-300">Conteúdo
                      <textarea name="content" defaultValue={article.content} required minLength={10} maxLength={10000} rows={7} className={fieldClass} />
                    </label>
                    <button type="submit" className="brand-button-primary w-fit"><Pencil size={16} /> Salvar alterações</button>
                  </form>
                  <form action={deleteNews.bind(null, article.id)} className="mt-4 border-t border-slate-700 pt-4">
                    <ConfirmSubmit message={`Excluir definitivamente “${article.title}”?`} className="inline-flex items-center gap-2 bg-clutch-pink/15 px-4 py-2 text-sm font-black text-clutch-pink hover:bg-clutch-pink/25">
                      <Trash2 size={16} /> Excluir notícia
                    </ConfirmSubmit>
                  </form>
                </div>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
