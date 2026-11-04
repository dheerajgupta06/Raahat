import { useState } from 'react';
import { Link2, MapPin, Phone, Plus, Share2, Trash2, UserRound, X } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useSavedContacts } from '../hooks/useSavedContacts.js';
import { isValidIndianMobile, mapsUrl, telHref, whatsappHref } from '../lib/format.js';

const EMPTY = { name: '', phone: '', relation: '' };

export function FamilyCircle() {
  const { t, location, pushToast } = useApp();
  const { contacts, addContact, removeContact } = useSavedContacts();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  const update = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError(t('auth.required'));
      return;
    }
    if (!isValidIndianMobile(form.phone)) {
      setError(t('circle.invalid'));
      return;
    }
    addContact(form);
    setForm(EMPTY);
    setError('');
    setFormOpen(false);
    pushToast(t('circle.added'), 'ok');
  };

  const shareLocation = (contact) => {
    const link = mapsUrl(location.lat, location.lng);
    const text = t('circle.shareText', { link });
    if (!contact.phone) {
      pushToast(t('circle.noLocation'), 'warn');
      return;
    }
    window.open(whatsappHref(contact.phone, text), '_blank', 'noopener');
  };

  const remove = (contact) => {
    removeContact(contact.id);
    pushToast(t('circle.removed'), 'info', 2400);
  };

  return (
    <section id="family-circle" className="panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label-xs">{t('circle.title')}</p>
          <h2 className="mt-1 text-xl font-bold text-body">{t('circle.title')}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">{t('circle.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormOpen((open) => !open);
            setError('');
          }}
          className="btn-outline min-h-[44px] px-3 text-xs"
        >
          {formOpen ? <X size={15} /> : <Plus size={15} />}
          {t('circle.add')}
        </button>
      </div>

      {formOpen ? (
        <form onSubmit={submit} className="mt-4 grid gap-2 rounded-xl border border-line bg-elevated/50 p-3 sm:grid-cols-2">
          <input
            value={form.name}
            onChange={update('name')}
            placeholder={t('circle.namePlaceholder')}
            className="field-sm"
            aria-label={t('circle.name')}
            autoComplete="name"
          />
          <input
            value={form.phone}
            onChange={update('phone')}
            placeholder={t('circle.phonePlaceholder')}
            className="field-sm"
            inputMode="tel"
            aria-label={t('circle.phone')}
            autoComplete="tel"
          />
          <input
            value={form.relation}
            onChange={update('relation')}
            placeholder={t('circle.relation')}
            className="field-sm sm:col-span-2"
            aria-label={t('circle.relation')}
          />
          {error ? <p className="text-xs font-semibold text-danger sm:col-span-2">{error}</p> : null}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn-accent min-h-[44px] flex-1 text-xs">
              <Plus size={15} /> {t('circle.add')}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setForm(EMPTY);
                setError('');
              }}
              className="btn-ghost min-h-[44px] px-3 text-xs"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      ) : null}

      {contacts.length ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {contacts.map((contact) => (
            <div key={contact.id} className="rounded-xl border border-line bg-elevated/40 p-3">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-accent/25 bg-accent/10 text-accent">
                  <UserRound size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-body">{contact.name}</p>
                  <p className="truncate text-[11px] text-muted">
                    {contact.phone}
                    {contact.relation ? ` · ${contact.relation}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(contact)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-danger/10 hover:text-danger"
                  aria-label={t('circle.removeName', { name: contact.name })}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                <a
                  href={telHref(contact.phone)}
                  className="btn-outline min-h-[40px] gap-1 px-2 text-[11px]"
                  aria-label={t('circle.callName', { name: contact.name })}
                >
                  <Phone size={13} /> {t('common.call')}
                </a>
                <button
                  type="button"
                  onClick={() => shareLocation(contact)}
                  className="btn-outline min-h-[40px] gap-1 border-ok/30 px-2 text-[11px] text-ok hover:border-ok/60 hover:text-ok"
                >
                  <Share2 size={13} /> {t('results.shareWhatsapp')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-line px-4 py-5 text-sm text-muted">
          <UserRound size={20} className="shrink-0 text-muted" />
          {t('circle.empty')}
        </div>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted">
        <Link2 size={11} /> {t('circle.localOnly')}
        <span className="mx-1">·</span>
        <MapPin size={11} /> {location.city || location.label}
      </p>
    </section>
  );
}
