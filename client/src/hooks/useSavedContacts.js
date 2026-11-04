import { useCallback, useEffect, useState } from 'react';
import { readJSON, writeJSON } from '../lib/cache.js';

const KEY = 'raahat.circle.v1';

export function useSavedContacts() {
  const [contacts, setContacts] = useState(() => {
    const value = readJSON(KEY, []);
    return Array.isArray(value) ? value : [];
  });

  useEffect(() => {
    writeJSON(KEY, contacts);
  }, [contacts]);

  const addContact = useCallback((contact) => {
    const entry = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: contact.name.trim(),
      phone: contact.phone.trim(),
      relation: (contact.relation || '').trim(),
      createdAt: new Date().toISOString(),
    };
    setContacts((prev) => [entry, ...prev].slice(0, 20));
    return entry;
  }, []);

  const removeContact = useCallback((id) => {
    setContacts((prev) => prev.filter((contact) => contact.id !== id));
  }, []);

  return { contacts, addContact, removeContact };
}
