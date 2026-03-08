import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8 space-y-8 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-primary drop-shadow-md">
          OTP: Observability Talent Pivot
        </h1>
        <p className="text-lg text-muted-foreground flex items-center justify-center gap-2 max-w-xl mx-auto">
          Plataforma de evaluación para el equipo Ópera. Identifica a las próximas estrellas del talento SRE.
        </p>
      </div>

      <div className="mt-8">
        <Link href="/login">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-full font-semibold shadow-lg transition-all drop-shadow-md">
            Ingresar a la Plataforma
          </Button>
        </Link>
      </div>
    </div>
  )
}
