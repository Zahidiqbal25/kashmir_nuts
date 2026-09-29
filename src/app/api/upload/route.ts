import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { jsonError, jsonOk } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return jsonError('No file provided')

    // Product images are rendered directly by the storefront, so create the
    // bucket on first upload and keep its files publicly readable.
    const { data: bucket, error: bucketLookupError } = await supabase.storage.getBucket('products')
    if (bucketLookupError && !bucket) {
      const { error: createBucketError } = await supabase.storage.createBucket('products', { public: true })
      if (createBucketError) throw new Error(`Unable to create product image storage: ${createBucketError.message}`)
    } else if (bucket && !bucket.public) {
      const { error: bucketUpdateError } = await supabase.storage.updateBucket('products', { public: true })
      if (bucketUpdateError) throw new Error(`Unable to configure product image storage: ${bucketUpdateError.message}`)
    }

    const ext = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error } = await supabase.storage
      .from('products')
      .upload(fileName, buffer, { contentType: file.type, upsert: true })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)

    return jsonOk({ url: publicUrl })
  } catch (err: any) {
    return jsonError(err.message || 'Upload failed', 500)
  }
}
