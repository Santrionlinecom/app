import { json } from '@sveltejs/kit';
import { v4 as uuidv4 } from 'uuid';

export async function POST({ request, platform }) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return json({ error: 'No file provided.' }, { status: 400 });
  }

  const fileExtension = file.name.split('.').pop();
  const filename = `${uuidv4()}.${fileExtension}`;

  try {
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
