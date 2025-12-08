import { json } from '@sveltejs/kit';

export async function POST({ request, platform }) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return json({ error: 'No file provided.' }, { status: 400 });
  }

  const fileExtension = file.name.split('.').pop();
  const filename = `${crypto.randomUUID()}.${fileExtension}`;

  try {
    if (!platform?.env?.BUCKET) {
      return json({ error: 'Storage binding (R2 BUCKET) is not available.' }, { status: 500 });
    }

    await platform.env.BUCKET.put(filename, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const publicUrl = `https://files.santrionline.com/${filename}`;
    return json({ url: publicUrl });
  } catch (error) {
    console.error('Error uploading to R2:', error);
    return json({ error: 'Failed to upload file.' }, { status: 500 });
  }
}
