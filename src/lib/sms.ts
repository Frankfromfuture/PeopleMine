import Dysmsapi, * as $Dysmsapi from '@alicloud/dysmsapi20170525'
import * as $OpenApi from '@alicloud/openapi-client'
import * as $Util from '@alicloud/tea-util'

let client: Dysmsapi | null = null

function getClient(): Dysmsapi {
  if (!client) {
    const config = new $OpenApi.Config({
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID!,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET!,
      endpoint: 'dysmsapi.aliyuncs.com',
    })
    client = new Dysmsapi(config)
  }
  return client
}

export async function sendOtp(phone: string, code: string): Promise<void> {
  const request = new $Dysmsapi.SendSmsRequest({
    phoneNumbers: phone,
    signName: process.env.ALIYUN_SMS_SIGN_NAME!,
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE!,
    templateParam: JSON.stringify({ code }),
  })

  const response = await getClient().sendSmsWithOptions(request, new $Util.RuntimeOptions({}))

  if (response.body?.code !== 'OK') {
    throw new Error(`短信发送失败：${response.body?.message}`)
  }
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}
