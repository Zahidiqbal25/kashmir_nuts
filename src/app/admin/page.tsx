import type { Metadata } from 'next'
import AdminClient from './AdminClient'

export const metadata: Metadata = { title: 'Admin Panel — NutriNuts' }

export default function AdminPage() {
  return <AdminClient />
}
