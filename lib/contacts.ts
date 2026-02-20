import * as Contacts from 'expo-contacts';

export type DeviceContact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  imageUri: string | null;
};

export async function requestContactsPermission(): Promise<boolean> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status === 'granted';
}

export async function getContacts(): Promise<DeviceContact[]> {
  const { data } = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Image],
    sort: Contacts.SortTypes.FirstName,
  });
  return data.map((c) => ({
    id: c.id,
    name: [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unknown',
    phone: c.phoneNumbers?.[0]?.number ?? null,
    email: c.emails?.[0]?.email ?? null,
    imageUri: c.image?.uri ?? null,
  }));
}
