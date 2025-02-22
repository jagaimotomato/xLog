import { NextApiRequest, NextApiResponse } from "next"
import { OUR_DOMAIN } from "~/lib/env"
import { cacheGet } from "~/lib/redis.server"
import { checkDomainServer, fetchTenant } from "~/models/site.model"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  let { host } = req.query

  let realHost: string
  if (Array.isArray(host)) {
    realHost = host[0]
  } else {
    realHost = host || ""
  }
  let result = {}

  const OUR_DOMAIN_SUFFIX = `.${OUR_DOMAIN}`
  if (realHost && realHost !== OUR_DOMAIN) {
    result = await cacheGet({
      key: ["host2handle", realHost],
      getValueFun: async () => {
        if (realHost.endsWith(OUR_DOMAIN_SUFFIX)) {
          const subdomain = realHost.replace(OUR_DOMAIN_SUFFIX, "")
          const res = await fetch(
            `https://indexer.crossbell.io/v1/handles/${subdomain}/character`,
          )
          const char = await res.json()
          const customDomain =
            char?.metadata?.content?.attributes?.find(
              (a: any) => a.trait_type === "xlog_custom_domain",
            )?.value || ""
          if (
            customDomain &&
            (await checkDomainServer(customDomain, subdomain))
          ) {
            return {
              redirect: /^https?:\/\//.test(customDomain)
                ? customDomain
                : `https://${customDomain}`,
              subdomain: subdomain,
            }
          } else {
            return {
              subdomain: subdomain,
            }
          }
        } else {
          const tenant = await fetchTenant(realHost, 5)
          return {
            subdomain: tenant,
          }
        }
      },
    })
  }

  res.status(200).json(result)
}
