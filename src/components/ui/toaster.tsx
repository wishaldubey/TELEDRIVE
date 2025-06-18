"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { Check, AlertCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Determine which icon to show based on the variant
        const Icon = variant === "destructive" 
          ? AlertCircle 
          : variant === "success" 
            ? Check 
            : Info;
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${variant === "destructive" ? "text-red-200" : variant === "success" ? "text-green-200" : "text-red-500"}`} />
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
} 