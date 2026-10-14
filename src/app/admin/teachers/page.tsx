'use client';
import { useEffect, useState, useCallback } from 'react';
import { Pencil, Phone, Plus, RefreshCw, Trash2, UserCheck, UserX } from 'lucide-react';
import { api } from '@/lib/api';
import { Avatar, Badge, Button, Card, Empty, ErrorBox, Field, Input, Modal, PageTitle, Spinner, levelTone } from '@/components/ui';
import { PhotoFace, PhotoValue } from '@/components/PhotoFace';

const genPass = () => Array.from({ length: 8 }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)]).join('');
type Form = { id?: string; fullName: string; phone: string; login: string; password: string };
const blank: Form = { fullName: '', phone: '', login: '', password: '' };

export default function Teachers() {
  const [list, setList] = useState<any[] | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<Form>(blank);
  const [pv, setPv] = useState<PhotoValue>({ photo: null, descriptor: null });
  const [curPhoto, setCurPhoto] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api('/api/admin/teachers').then((r) => setList(r.teachers)), []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setF({ ...blank, password: genPass() }); setPv({ photo: null, descriptor: null }); setCurPhoto(null); setErr(''); setOpen(true); }
  function openEdit(t: any) { setF({ id: t.id, fullName: t.fullName, phone: t.phone, login: t.login, password: '' }); setPv({ photo: null, descriptor: null }); setCurPhoto(t.photo); setErr(''); setOpen(true); }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const body: any = { fullName: f.fullName, phone: f.phone, login: f.login, password: f.password || undefined, ...(pv.descriptor ? { photo: pv.photo, descriptor: pv.descriptor } : {}) };
      if (f.id) await api(`/api/admin/teachers/${f.id}`, { method: 'PUT', body });
      else await api('/api/admin/teachers', { body });
      setOpen(false); load();
    } catch (er: any) { setErr(er.message); }
    setBusy(false);
  }
  async function toggle(t: any) { await api(`/api/admin/teachers/${t.id}`, { method: 'PUT', body: { active: !t.active } }); load(); }
  async function remove(t: any) {
    if (!confirm(`${t.fullName} o'chirilsinmi?\nDavomat tarixi bo'lsa, o'qituvchi o'chirilmaydi, faqat faolsizlantiriladi.`)) return;
    const r = await api(`/api/admin/teachers/${t.id}`, { method: 'DELETE' });
    if (r.archived) alert("Davomat tarixi saqlanib qoldi: o'qituvchi faolsizlantirildi.");
    load();
  }

  return (
    <div>
      <PageTitle title="O'qituvchilar" sub="Profil, login va parolni siz belgilaysiz" action={<Button onClick={openNew}><Plus size={16} /> Yangi o'qituvchi</Button>} />
      {!list ? <Spinner /> : list.length === 0 ? <Card><Empty title="Hali o'qituvchi qo'shilmagan" text="“Yangi o'qituvchi” tugmasi orqali birinchisini qo'shing." /></Card> : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((t) => (
            <Card key={t.id} className={`p-4 ${t.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start gap-3">
                <Avatar src={t.photo} name={t.fullName} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{t.fullName}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500"><Phone size={13} /> {t.phone}</p>
                  <p className="mt-0.5 text-xs text-ink-500">Login: <span className="font-medium text-ink-700">{t.login}</span> · {t.groups} ta guruh</p>
                </div>
                {t.summary && <Badge tone={levelTone(t.summary.level)}>{t.summary.score}%</Badge>}
                {!t.active && <Badge>Faol emas</Badge>}
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil size={14} /> Tahrirlash</Button>
                <Button size="sm" variant="ghost" onClick={() => toggle(t)}>{t.active ? <><UserX size={14} /> To'xtatish</> : <><UserCheck size={14} /> Faollashtirish</>}</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(t)} aria-label="O'chirish"><Trash2 size={14} className="text-red-600" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={f.id ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi"}>
        <form onSubmit={save} className="space-y-4">
          {err && <ErrorBox>{err}</ErrorBox>}
          <PhotoFace value={pv} current={curPhoto} onChange={setPv} />
          <Field label="Ism familiya"><Input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} required /></Field>
          <Field label="Telefon raqami"><Input type="tel" inputMode="tel" placeholder="+998 90 123 45 67" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Login"><Input value={f.login} onChange={(e) => setF({ ...f, login: e.target.value })} autoCapitalize="none" required /></Field>
            <Field label={f.id ? 'Yangi parol' : 'Parol'} hint={f.id ? "O'zgartirmasangiz bo'sh qoldiring" : 'Kamida 6 belgi'}>
              <div className="flex gap-2">
                <Input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} minLength={f.password ? 6 : undefined} required={!f.id} />
                <button type="button" onClick={() => setF({ ...f, password: genPass() })} aria-label="Parol yaratish" className="rounded-xl border border-ink-200 px-3 text-ink-500 hover:bg-ink-50"><RefreshCw size={16} /></button>
              </div>
            </Field>
          </div>
          {!f.id && !pv.descriptor && <p className="text-xs text-ink-500">Profil yaratish uchun yuzi aniqlangan rasm yuklash shart.</p>}
          <Button type="submit" size="lg" loading={busy} disabled={!f.id && !pv.descriptor} className="w-full">{f.id ? 'Saqlash' : 'Profil yaratish'}</Button>
        </form>
      </Modal>
    </div>
  );
}
