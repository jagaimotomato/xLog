import { Button } from "~/components/ui/Button"
import type { Variant } from "~/components/ui/Button"
import { useEffect } from "react"
import {
  useGetSubscription,
  useSubscribeToSite,
  useUnsubscribeFromSite,
  useAccountSites,
} from "~/queries/site"
import { useConnectedAction } from "@crossbell/connect-kit"
import { cn } from "~/lib/utils"
import { Profile } from "~/lib/types"
import { Trans, useTranslation } from "next-i18next"
import { toast } from "react-hot-toast"
import { UniLink } from "~/components/ui/UniLink"
import { SITE_URL } from "~/lib/env"

export const FollowingButton: React.FC<{
  site: Profile | undefined | null
  variant?: Variant
  className?: string
  size?: "sm" | "xl"
  loadingStatusChange?: (status: boolean) => void
}> = ({ site, variant, className, size, loadingStatusChange }) => {
  const subscribeToSite = useSubscribeToSite()
  const unsubscribeFromSite = useUnsubscribeFromSite()
  const userSite = useAccountSites()
  const characterId = site?.metadata?.proof ? Number(site.metadata.proof) : null
  const { t } = useTranslation("common")

  const handleClickSubscribe = useConnectedAction(() => {
    if (characterId) {
      if (subscription.data) {
        unsubscribeFromSite.mutate({
          characterId,
          siteId: site?.username,
        } as any)
      } else {
        subscribeToSite.mutate({
          characterId,
          siteId: site?.username,
        } as any)
      }
    }
  })

  const subscription = useGetSubscription(site?.username)

  useEffect(() => {
    if (subscribeToSite.isError) {
      subscribeToSite.reset()
    }
  }, [subscribeToSite])

  useEffect(() => {
    if (subscribeToSite.isSuccess) {
      subscribeToSite.reset()
      toast.success(
        <span>
          <Trans i18nKey="Successfully followed" ns="common">
            Hey there! You&apos;re all set to{" "}
            <UniLink className="underline" href={`${SITE_URL}/activities`}>
              keep up with your followed blogger&apos;s latest buzz here
            </UniLink>
            .
          </Trans>
        </span>,
        {
          duration: 5000,
        },
      )
    }
  }, [subscribeToSite, t])

  useEffect(() => {
    if (unsubscribeFromSite.isLoading || subscribeToSite.isLoading) {
      loadingStatusChange?.(true)
    } else {
      loadingStatusChange?.(false)
    }
  }, [
    unsubscribeFromSite.isLoading,
    subscribeToSite.isLoading,
    loadingStatusChange,
  ])

  return (
    <Button
      variant={subscription.data ? "text" : variant}
      onClick={handleClickSubscribe}
      className={cn(
        className,
        "align-middle group border-accent border text-sm sm:text-base",
        {
          "text-accent": subscription.data,
          "opacity-60": subscription.data,
        },
      )}
      isLoading={
        subscription.data
          ? unsubscribeFromSite.isLoading || subscribeToSite.isLoading
          : userSite.isLoading ||
            unsubscribeFromSite.isLoading ||
            subscribeToSite.isLoading ||
            subscription.isLoading
      }
      size={size}
      aria-label="follow"
      isAutoWidth
    >
      {subscription.data ? (
        <>
          <span className="group-hover:hidden inline-flex items-center">
            <span className="i-mingcute:user-follow-fill inline-block sm:mr-2"></span>{" "}
            <span className="hidden sm:inline">{t("Following")}</span>
          </span>
          <span className="hidden group-hover:inline-flex items-center">
            <span className="i-mingcute:user-remove-fill inline-block sm:mr-2"></span>{" "}
            <span className="hidden sm:inline">{t("Unfollow")}</span>
          </span>
        </>
      ) : (
        <span className="inline-flex items-center">
          <span className="i-mingcute:user-add-fill inline-block sm:mr-2"></span>{" "}
          <span className="hidden sm:inline">{t("Follow")}</span>
        </span>
      )}
    </Button>
  )
}
