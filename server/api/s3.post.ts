import { $fetch } from 'ofetch'
import type { FeathersResponsePlan, Plan } from '~/stores/planes'

export default defineEventHandler(
  eventHandler(async (event: any) => {
    const config = useRuntimeConfig()
    const method = event.method
    let url = ''

    if (config.NODE_ENV === 'production') {
      url = config.HK_SERVER + '/s-3/'
    } else {
      url = config.HK_LOCAL + '/s-3/'
    }
    console.log('url', url)
    console.log('method', method)

    try {
      // console.log("body inside the post ", event);
      if (method === 'POST') {
        const body = await readBody(event)
        const base64Content = body.file.content.replace(
          /^data:.*?;base64,/,
          ''
        )
        const buffer = Buffer.from(base64Content, 'base64')
        // const binString = buffer.toString("binary");
        // console.log("buffer", buffer.length);
        body.file.content = new Blob([buffer], { type: body.file.type })
        // console.log("bodyfilecontentlenght", body.file.content.length);
        const formData = new FormData()
        formData.append('file', body.file.content, body.file.name)
        formData.append('originalname', body.file.name)
        formData.append('mimetype', body.file.type)

        // const boundary =
        //   "----WebKitFormBoundary" + Math.random().toString(36).substring(2);
        // const bodyforsend = [
        //   `--${boundary}`,
        //   `Content-Disposition: form-data; name="file"; filename="${body.file.name}"`,
        //   `Content-Type: ${body.file.type}`,
        //   "",
        //   body.file.content,
        //   `--${boundary}`,
        //   'Content-Disposition: form-data; name="originalname"',
        //   "",
        //   body.file.name,
        //   `--${boundary}`,
        //   'Content-Disposition: form-data; name="mimetype"',
        //   "",
        //   body.file.type,
        //   `--${boundary}--`,
        // ].join("\r\n");

        try {
          const response = await $fetch(url, {
            method: 'POST',
            headers: {
              // "Content-Type": `multipart/form-data; boundary=${boundary}`,
              // "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${body.accessToken}`
            },
            // body: bodyforsend,
            body: formData
          })
          // const responseData = (await response.json()) as FeathersResponsePlan;
          return {
            limit: response.limit,
            skip: response.skip,
            total: response.total,
            data: response.data
          }
        } catch (err) {
          console.error(err)
        }
      }
    } catch (error) {
      throw createError({
        statusMessage: `Error creating s3: ${error}`
      })
    }
  })
)
