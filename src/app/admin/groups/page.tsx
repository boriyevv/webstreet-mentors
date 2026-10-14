'use client';
import { useEffect, useState, useCallback } from 'react';
import { Archive, Clock, DoorOpen, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Modal, PageTitle, Select, Spinner } from '@/components/ui';
import { DAY_SHORT, dateStr } from '@/lib/time';

type Form = { id?: string; name: string; teacherId: string; room: string; days: number[]; startTime: string; endTime: string; startDate: string };
const blank = (): Form => ({ name: '', teacherId: '', room: '', days: [1, 3, 5], startTime: '14:00', endTime: '15:30', startDate: dateStr() });

export default function Groups() {
  const [groups, setGroups] = useState<any[] | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Form>(blank());
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('');
  const load = useCallback(async () => {
    const [g, t] = await Promise.all([api('/api/admin/groups'), api('/api/admin/teachers')]);
    setGroups(g.groups); setTeachers(t.teachers.filter((x: any) => x.active));
  }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setF({ ...blank(), teacherId: teachers[0]?.id || '' }); setErr(''); setOpen(true); }
  function openEdit(g: any) { setF({ id: g.id, name: g.name, teacherId: g.teacherId, room: g.room, days: g.days, startTime: g.startTime, endTime: g.endTime, startDate: g.startDate }); setErr(''); setOpen(true); }
  const toggleDay = (n: number) => setF({ ...f, days: f.days.includes(n) ? f.days.filter((d) => d !== n) : [...f.days, n] });

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (f.id) await api(`/api/admin/groups/${f.id}`, { method: 'PUT', body: f });
      else await api('/api/admin/groups', { body: f });
      setOpen(false); load();
    } catch (er: any) { setErr(er.message); }
    setBusy(false);
  }
  async function remove(g: any) {
    if (!confirm(`"${g.name}" guruhi o'chirilsinmi?\nDavomat yozuvlari bo'lsa, guruh arxivga o'tkaziladi.`)) return;
    const r = await api(`/api/admin/groups/${g.id}`, { method: 'DELETE' });
    if (r.archived) alert('Davomat tarixi saqlanib qoldi: guruh arxivga o\'tkazildi.');
    load();
  }
  async function restore(g: any) { await api(`/api/admin/groups/${g.id}`, { method: 'PUT', body: { restore: true } }); load(); }

  const shown = (groups || []).filter((g) => !filter || g.teacherId === filter);
  return (
    <div>
      <PageTitle title="Guruhlar" sub="Dars kunlari, vaqti va xonasi" action={<Button onClick={openNew} disabled={teachers.length === 0}><Plus size={16} /> Yangi guruh</Button>} />
      {teachers.length === 0 && groups && <div className="mb-4"><ErrorBox>Guruh ochishdan oldin kamida bitta o'qituvchi qo'shing.</ErrorBox></div>}
      {!groups ? <Spinner /> : (
        <>
          <div className="mb-4 max-w-xs">
            <Select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="O'qituvchi bo'yicha">
              <option value="">Barcha o'qituvchilar</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </Select>
          </div>
          {shown.length === 0 ? <Card><Empty title="Guruhlar yo'q" /></Card> : (
            <div className="grid gap-3 md:grid-cols-2">
              {shown.map((g) => (
                <Card key={g.id} className={`p-4 ${g.active ? '' : 'opacity-60'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="truncate font-semibold">{g.name}</p><p className="text-sm text-ink-500">{g.teacherName}</p></div>
                    {!g.active && <Badge><Archive size={12} className="mr-1" /> Arxiv</Badge>}
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-700">
                    <span className="inline-flex items-center gap-1"><Clock size={14} /> {g.startTime}–{g.endTime}</span>
                    <span className="inline-flex items-center gap-1"><DoorOpen size={14} /> {g.room}-xona</span>
                  </p>
                  <div className="mt-2.5 flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => <span key={n} className={`rounded-md px-2 py-1 text-xs font-medium ${g.days.includes(n) ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-300'}`}>{DAY_SHORT[n]}</span>)}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {g.active ? <Button size="sm" variant="ghost" onClick={() => openEdit(g)}><Pencil size={14} /> Tahrirlash</Button> : <Button size="sm" variant="ghost" onClick={() => restore(g)}><RotateCcw size={14} /> Tiklash</Button>}
                    <Button size="sm" variant="ghost" onClick={() => remove(g)} aria-label="O'chirish"><Trash2 size={14} className="text-red-600" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={f.id ? 'Guruhni tahrirlash' : 'Yangi guruh'}>
        <form onSubmit={save} className="space-y-4">
          {err && <ErrorBox>{err}</ErrorBox>}
          <Field label="Guruh nomi"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Yosh dasturchi – 1" required /></Field>
          <Field label="O'qituvchi">
            <Select value={f.teacherId} onChange={(e) => setF({ ...f, teacherId: e.target.value })} required>
              <option value="" disabled>Tanlang</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </Select>
          </Field>
          <Field label="Xona"><Input value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })} placeholder="2" required /></Field>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-700">Dars kunlari</span>
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button type="button" key={n} onClick={() => toggleDay(n)} aria-pressed={f.days.includes(n)} className={`rounded-lg px-3 py-2 text-sm font-medium ${f.days.includes(n) ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-700'}`}>{DAY_SHORT[n]}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Boshlanishi"><Input type="time" value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} required /></Field>
            <Field label="Tugashi"><Input type="time" value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} required /></Field>
          </div>
          <Field label="Guruh boshlanish sanasi" hint="Shu sanadan oldingi kunlar davomatga hisoblanmaydi"><Input type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} required /></Field>
          <Button type="submit" size="lg" loading={busy} className="w-full">Saqlash</Button>
        </form>
      </Modal>
    </div>
  );
}
